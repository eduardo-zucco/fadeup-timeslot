import { HttpError, ValidationError } from '../domain/errors.mjs';
export const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export async function readBody(request) {
  let body;
  try { body = await request.json(); } catch { throw new ValidationError('Os dados enviados são inválidos. Confira e tente novamente.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Envie os dados em um objeto JSON.');
  return body;
}
export function errorResponse(error) {
  if (error instanceof ValidationError) return json({ error: error.message, fields: error.fields }, 400);
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error('request_failed', error?.message);
  return json({ error: 'Não foi possível acessar a agenda. Tente novamente em instantes.' }, 500);
}
