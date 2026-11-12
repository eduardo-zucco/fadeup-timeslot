import { defaults, available, customer, cells, validConfig, dateOK, time } from './domain.mjs';
const json = (v, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });
export function createApi(env) {
    async function handle(req) {
        const db = env.DB;
        if (!db)
            return json({ error: 'Banco indisponível.' }, 503);
        const url = new URL(req.url), path = url.pathname.replace('/api/', '').split('/');
        const email = req.headers.get('oai-authenticated-user-email');
        const supplied = req.headers.get('X-Admin-Key') || '';
        const expected = env.ADMIN_KEY || '';
        let mismatch = supplied.length ^ expected.length;
        for (let i = 0; i < expected.length; i++) mismatch |= (supplied.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
        const keyAuthorized = expected.length >= 24 && mismatch === 0;
        const admin = (!!email && email === env.ADMIN_EMAIL) || keyAuthorized;
        if (req.method !== 'GET' && req.headers.get('Origin') && req.headers.get('Origin') !== url.origin)
            return json({ error: 'Origem inválida.' }, 403);
        if (path[0] === 'admin' && !admin)
            return json({ error: 'Acesso restrito ao responsável da barbearia.' }, 403);
        const row = await db.prepare("SELECT value FROM settings WHERE key='config'").first(), config = row ? JSON.parse(row.value) : defaults;
        if (path[0] === 'config' && req.method === 'GET')
            return json({ ...config, admin });
        if (path[0] === 'slots' && req.method === 'GET') {
            const date = url.searchParams.get('date') || '', service = config.services.find((s) => s.id === url.searchParams.get('service'));
            if (!service || !dateOK(date))
                return json({ error: 'Data ou serviço inválido.' }, 400);
            const used = await db.prepare('SELECT minute FROM occupancy WHERE date=?').bind(date).all();
            return json({ slots: available(date, service.duration, config, used.results.map(x => x.minute)) });
        }
        if (path[0] === 'admin' && path[1] === 'config' && req.method === 'PUT') {
            const c = await req.json();
            if (!validConfig(c))
                return json({ error: 'Configuração inválida. Horários devem ser múltiplos de 15 minutos.' }, 400);
            await db.prepare("INSERT INTO settings(key,value) VALUES('config',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(c)).run();
            return json({ ok: true });
        }
        if (path[0] === 'admin' && path[1] === 'agenda' && req.method === 'GET') {
            const date = url.searchParams.get('date') || '', end = url.searchParams.get('end') || date;
            if (!dateOK(date) || !dateOK(end) || end < date)
                return json({ error: 'Período inválido.' }, 400);
            const records = await db.prepare('SELECT id,name,phone,service,price,duration,date,start,status,kind FROM bookings WHERE date>=? AND date<=? ORDER BY date,start').bind(date, end).all();
            const messages = await db.prepare('SELECT type,status,scheduled FROM outbox ORDER BY created DESC LIMIT 30').all();
            return json({ records: records.results, messages: messages.results });
        }
        const owner = path[0] === 'admin', p = owner ? path.slice(1) : path;
        if (p[0] !== 'bookings')
            return json({ error: 'Não encontrado.' }, 404);
        const id = p[1], now = new Date().toISOString();
        const message = (id, t, date, start) => db.prepare("INSERT INTO outbox(id,booking,type,status,scheduled,created) VALUES(?,?,?,'pending',?,?)").bind(crypto.randomUUID(), id, t, t === 'reminder' ? new Date(+new Date(`${date}T${time(start)}:00-03:00`) - 7200000).toISOString() : now, now);
        if (id) {
            const b = await db.prepare('SELECT * FROM bookings WHERE id=?').bind(id).first();
            if (!b || (!admin && req.headers.get('X-Booking-Token') !== b.token))
                return json({ error: 'Agendamento não encontrado.' }, 404);
            if (req.method === 'GET') {
                const { token, ...safe } = b;
                return json(safe);
            }
            if (b.status !== 'confirmed')
                return json({ error: 'Agendamento encerrado.' }, 409);
            if (!admin && +new Date(`${b.date}T${time(b.start)}:00-03:00`) <= Date.now())
                return json({ error: 'O atendimento já começou.' }, 409);
            if (req.method === 'DELETE') {
                await db.batch([db.prepare('DELETE FROM occupancy WHERE booking=?').bind(id), db.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").bind(id), db.prepare("UPDATE outbox SET status='cancelled' WHERE booking=? AND status='pending'").bind(id), message(id, 'cancellation', b.date, b.start)]);
                return json({ ok: true });
            }
            if (req.method === 'PATCH') {
                const n = await req.json(), used = await db.prepare('SELECT minute FROM occupancy WHERE date=? AND booking<>?').bind(n.date, id).all();
                if (!available(n.date, b.duration, config, used.results.map(x => x.minute)).includes(n.start))
                    return json({ error: 'Horário indisponível.' }, 409);
                try {
                    await db.batch([db.prepare('DELETE FROM occupancy WHERE booking=?').bind(id), db.prepare('UPDATE bookings SET date=?,start=? WHERE id=?').bind(n.date, n.start, id), ...cells(n.start, b.duration, config.interval).map(m => db.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').bind(n.date, m, id)), db.prepare("UPDATE outbox SET status='cancelled' WHERE booking=? AND status='pending'").bind(id), message(id, 'confirmation', n.date, n.start), message(id, 'reminder', n.date, n.start)]);
                }
                catch {
                    return json({ error: 'A reserva ou o horário mudou. Atualize os dados e tente novamente.' }, 409);
                }
                return json({ ok: true });
            }
        }
        if (!id && req.method === 'POST') {
            const b = await req.json(), block = owner && b.kind === 'block', who = block ? { name: String(b.name || 'Bloqueio').slice(0, 80), phone: '' } : customer(b);
            const service = block ? { name: 'Bloqueio', duration: b.duration, price: 0 } : config.services.find((s) => s.id === b.service);
            if (!service || ![15, 30, 45, 60, 75, 90, 120].includes(service.duration))
                return json({ error: 'Serviço inválido.' }, 400);
            const used = await db.prepare('SELECT minute FROM occupancy WHERE date=?').bind(b.date).all();
            if (!available(b.date, service.duration, config, used.results.map(x => x.minute)).includes(b.start))
                return json({ error: 'Horário indisponível.' }, 409);
            const id = crypto.randomUUID(), token = crypto.randomUUID() + crypto.randomUUID();
            const stmts = [db.prepare('INSERT INTO bookings(id,token,name,phone,service,price,duration,date,start,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, token, who.name, who.phone, service.name, service.price, service.duration, b.date, b.start, 'confirmed', block ? 'block' : 'appointment', now), ...cells(b.start, service.duration, config.interval).map(m => db.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').bind(b.date, m, id))];
            if (!block)
                stmts.push(message(id, 'confirmation', b.date, b.start), message(id, 'reminder', b.date, b.start));
            try {
                await db.batch(stmts);
            }
            catch {
                return json({ error: 'Horário acabou de ser ocupado. Escolha outro.' }, 409);
            }
            return json({ id, token, ...who, service: service.name, duration: service.duration, date: b.date, start: b.start, status: 'confirmed' }, 201);
        }
        return json({ error: 'Método não permitido.' }, 405);
    }
    async function safe(req) { try {
        return await handle(req);
    }
    catch (e) {
        console.error('request_failed', e?.message);
        return json({ error: e instanceof SyntaxError ? 'Dados inválidos.' : 'Não foi possível concluir. Verifique os dados.' }, 400);
    } }
    return safe;
}
