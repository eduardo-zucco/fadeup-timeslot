import { defaults, available, customer, cells, validConfig, dateOK, time, agendaRangeOK, ValidationError } from './domain.mjs';

const json = (value, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const isConflict = error => /UNIQUE constraint failed|booking_not_confirmed|constraint failed.*occupancy/i.test(error?.message || '');

async function readBody(request) {
  const body = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Envie os dados em um objeto JSON.');
  return body;
}

export function createApi(env) {
  async function handle(request) {
    const db = env.DB;
    if (!db) return json({ error: 'A agenda está temporariamente indisponível. Tente novamente.' }, 503);
    const url = new URL(request.url);
    const segments = url.pathname.replace('/api/', '').split('/');
    const email = request.headers.get('oai-authenticated-user-email');
    const supplied = request.headers.get('X-Admin-Key') || '';
    const expected = env.ADMIN_KEY || '';
    let mismatch = supplied.length ^ expected.length;
    for (let i = 0; i < expected.length; i++) mismatch |= (supplied.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
    const admin = (!!email && email === env.ADMIN_EMAIL) || (expected.length >= 24 && mismatch === 0);
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) {
      return json({ error: 'Origem inválida.' }, 403);
    }
    const adminRoute = segments[0] === 'admin';
    if (adminRoute && !admin) return json({ error: 'Entre no painel para realizar esta operação.' }, 403);
    const path = adminRoute ? segments.slice(1) : segments;
    const stored = await db.prepare("SELECT value FROM settings WHERE key='config'").first();
    const config = stored ? JSON.parse(stored.value) : defaults;
    const now = new Date().toISOString();

    async function slots(date, duration, exclude = null) {
      if (!dateOK(date)) throw new ValidationError('Escolha uma data de hoje até os próximos 90 dias.');
      const used = exclude
        ? await db.prepare('SELECT minute FROM occupancy WHERE date=? AND booking<>?').bind(date, exclude).all()
        : await db.prepare('SELECT minute FROM occupancy WHERE date=?').bind(date).all();
      return available(date, duration, config, used.results.map(row => row.minute));
    }

    function message(id, type, date, start) {
      const scheduled = type === 'reminder' ? new Date(+new Date(`${date}T${time(start)}:00-03:00`) - 7200000).toISOString() : now;
      return db.prepare("INSERT INTO outbox(id,booking,type,status,scheduled,created) VALUES(?,?,?,'pending',?,?)")
        .bind(crypto.randomUUID(), id, type, scheduled, now);
    }

    if (path.length === 1 && path[0] === 'config') {
      if (request.method === 'GET' && !adminRoute) return json({ ...config, admin });
      if (request.method === 'PUT' && adminRoute) {
        const updated = await readBody(request);
        if (!validConfig(updated)) throw new ValidationError('Confira serviços, dias e expediente. Use horários em múltiplos de 15 minutos.');
        updated.name = updated.name.trim();
        updated.services = updated.services.map(service => ({ ...service, name: service.name.trim() }));
        await db.prepare("INSERT INTO settings(key,value) VALUES('config',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
          .bind(JSON.stringify(updated)).run();
        return json({ ok: true });
      }
      return json({ error: 'Método não permitido.' }, 405);
    }

    if (path.length === 1 && path[0] === 'slots' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      const service = config.services.find(value => value.id === url.searchParams.get('service'));
      const duration = adminRoute ? Number(url.searchParams.get('duration')) : service?.duration;
      if (![15, 30, 45, 60, 75, 90, 120].includes(duration)) throw new ValidationError('Escolha um serviço ou uma duração válida.');
      return json({ slots: await slots(date, duration) });
    }

    if (adminRoute && path.length === 1 && path[0] === 'agenda' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      const end = url.searchParams.get('end') || date;
      if (!agendaRangeOK(date, end)) throw new ValidationError('Escolha um período válido de até 31 dias.');
      const records = await db.prepare('SELECT id,name,phone,service,price,duration,date,start,status,kind FROM bookings WHERE date>=? AND date<=? ORDER BY date,start')
        .bind(date, end).all();
      return json({ records: records.results });
    }

    if (path[0] !== 'bookings' || path.length > 3 || (path.length === 3 && path[2] !== 'slots')) {
      return json({ error: 'Não encontrado.' }, 404);
    }
    const id = path[1];
    if (id) {
      const booking = await db.prepare('SELECT * FROM bookings WHERE id=?').bind(id).first();
      if (!booking || (!admin && request.headers.get('X-Booking-Token') !== booking.token)) return json({ error: 'Reserva não encontrada ou link inválido.' }, 404);
      if (path.length === 3) {
        if (request.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);
        if (booking.status !== 'confirmed') return json({ error: 'Esta reserva já foi cancelada.' }, 409);
        return json({ slots: await slots(url.searchParams.get('date'), booking.duration, id) });
      }
      if (request.method === 'GET') {
        const { token, ...safe } = booking;
        return json(safe);
      }
      if (!['PATCH', 'DELETE'].includes(request.method)) return json({ error: 'Método não permitido.' }, 405);
      if (booking.status !== 'confirmed') return json({ error: 'Esta reserva já foi cancelada. Atualize seus horários.' }, 409);
      if (!admin && +new Date(`${booking.date}T${time(booking.start)}:00-03:00`) <= Date.now()) return json({ error: 'Este atendimento já começou. Fale com a barbearia.' }, 409);
      if (request.method === 'DELETE') {
        await db.batch([
          db.prepare('DELETE FROM occupancy WHERE booking=?').bind(id),
          db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").bind(id),
          db.prepare("UPDATE outbox SET status='cancelled' WHERE booking=? AND status='pending'").bind(id),
          message(id, 'cancellation', booking.date, booking.start),
        ]);
        return json({ ok: true });
      }
      const updated = await readBody(request);
      if (!(await slots(updated.date, booking.duration, id)).includes(updated.start)) return json({ error: 'Esse horário não está mais disponível. Escolha outro.' }, 409);
      try {
        await db.batch([
          db.prepare('DELETE FROM occupancy WHERE booking=?').bind(id),
          db.prepare("UPDATE bookings SET date=?,start=? WHERE id=? AND status='confirmed'").bind(updated.date, updated.start, id),
          ...cells(updated.start, booking.duration, config.interval).map(minute => db.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').bind(updated.date, minute, id)),
          db.prepare("UPDATE outbox SET status='cancelled' WHERE booking=? AND status='pending'").bind(id),
          message(id, 'confirmation', updated.date, updated.start), message(id, 'reminder', updated.date, updated.start),
        ]);
      } catch (error) {
        if (!isConflict(error)) throw error;
        return json({ error: 'A reserva ou o horário mudou. Atualize os dados e tente novamente.' }, 409);
      }
      return json({ ok: true });
    }

    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
    const body = await readBody(request);
    const block = adminRoute && body.kind === 'block';
    const who = block ? { name: String(body.name || '').trim(), phone: '' } : customer(body);
    if (block && (who.name.length < 2 || who.name.length > 80)) throw new ValidationError('Informe o motivo do bloqueio, entre 2 e 80 caracteres.');
    const service = block ? { name: 'Bloqueio', duration: body.duration, price: 0 } : config.services.find(value => value.id === body.service);
    if (!service || ![15, 30, 45, 60, 75, 90, 120].includes(service.duration)) throw new ValidationError('O serviço foi alterado. Atualize a lista e escolha novamente.');
    if (!(await slots(body.date, service.duration)).includes(body.start)) return json({ error: 'Esse horário não está mais disponível. Escolha outro.' }, 409);
    const bookingId = crypto.randomUUID();
    const token = crypto.randomUUID() + crypto.randomUUID();
    const statements = [
      db.prepare('INSERT INTO bookings(id,token,name,phone,service,price,duration,date,start,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(bookingId, token, who.name, who.phone, service.name, service.price, service.duration, body.date, body.start, 'confirmed', block ? 'block' : 'appointment', now),
      ...cells(body.start, service.duration, config.interval).map(minute => db.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').bind(body.date, minute, bookingId)),
    ];
    if (!block) statements.push(message(bookingId, 'confirmation', body.date, body.start), message(bookingId, 'reminder', body.date, body.start));
    try { await db.batch(statements); } catch (error) {
      if (!isConflict(error)) throw error;
      return json({ error: 'Esse horário acabou de ser ocupado. Escolha outro.' }, 409);
    }
    return json({ id: bookingId, token, ...who, service: service.name, price: service.price, duration: service.duration, date: body.date, start: body.start, status: 'confirmed', kind: block ? 'block' : 'appointment' }, 201);
  }

  return async request => {
    try { return await handle(request); } catch (error) {
      if (error instanceof ValidationError) return json({ error: error.message, fields: error.fields }, 400);
      if (error instanceof SyntaxError) return json({ error: 'Os dados enviados são inválidos. Confira e tente novamente.' }, 400);
      console.error('request_failed', error?.message);
      return json({ error: 'Não foi possível acessar a agenda. Tente novamente em instantes.' }, 500);
    }
  };
}
