import { createAgendaRepository } from '../repositories/agenda-repository.mjs';
import { createAgendaService } from '../services/agenda-service.mjs';
import { isOperator } from './auth.mjs';
import { json, readBody, errorResponse } from './response.mjs';

export function createApi(env) {
  const service = env.DB ? createAgendaService(createAgendaRepository(env.DB)) : null;
  async function handle(request) {
    if (!service) return json({ error: 'A agenda está temporariamente indisponível. Tente novamente.' }, 503);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return json({ error: 'Não encontrado.' }, 404);
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({ error: 'Origem inválida.' }, 403);
    const segments = url.pathname.slice(5).split('/');
    const operator = segments[0] === 'admin';
    if (operator && !isOperator(request, env)) return json({ error: 'Entre no painel para realizar esta operação.' }, 403);
    const path = operator ? segments.slice(1) : segments;
    const query = url.searchParams;
    const method = request.method;
    const token = request.headers.get('X-Booking-Token');

    if (operator && path.length === 1 && path[0] === 'session') return method === 'GET' ? json({ authenticated: true }) : json({ error: 'Método não permitido.' }, 405);
    if (path.length === 1 && path[0] === 'config') {
      if (method === 'GET') return json(await service.getConfig());
      if (operator && method === 'PUT') { await service.updateConfig(await readBody(request)); return json({ ok: true }); }
      return json({ error: 'Método não permitido.' }, 405);
    }
    if (path.length === 1 && path[0] === 'slots' && method === 'GET') return json({ slots: await service.listSlots(query.get('date'), query.get('service'), Number(query.get('duration')), operator) });
    if (operator && path.length === 1 && path[0] === 'agenda' && method === 'GET') return json({ records: await service.listAgenda(query.get('date'), query.get('end') || query.get('date')) });
    if (path[0] !== 'bookings' || path.length > 3 || (path.length === 3 && path[2] !== 'slots')) return json({ error: 'Não encontrado.' }, 404);
    const id = path[1];
    if (id) {
      if (path.length === 3) return method === 'GET' ? json({ slots: await service.bookingSlots(id, query.get('date'), token, operator) }) : json({ error: 'Método não permitido.' }, 405);
      if (method === 'GET') return json(await service.getBooking(id, token, operator));
      if (method === 'DELETE') { await service.cancelBooking(id, token, operator); return json({ ok: true }); }
      if (method === 'PATCH') { await service.moveBooking(id, await readBody(request), token, operator); return json({ ok: true }); }
      return json({ error: 'Método não permitido.' }, 405);
    }
    if (method === 'POST') return json(await service.createBooking(await readBody(request), operator), 201);
    return json({ error: 'Método não permitido.' }, 405);
  }
  return async request => { try { return await handle(request); } catch (error) { return errorResponse(error); } };
}
