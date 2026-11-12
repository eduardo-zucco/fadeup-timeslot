export const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
export const clock = minute => `${Math.floor(minute / 60)}`.padStart(2, '0') + ':' + `${minute % 60}`.padStart(2, '0');
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const dateLabel = date => new Date(date + 'T12:00:00-03:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
export const shiftDate = (date, days) => new Date(+new Date(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
export const startsAt = booking => +new Date(`${booking.date}T${clock(booking.start)}:00-03:00`);
export const canManage = (booking, now = Date.now()) => booking.status === 'confirmed' && startsAt(booking) > now;

export function mergeReservationKeys(items, item) {
  const valid = value => value && typeof value.id === 'string' && /^[\da-f-]{36}$/i.test(value.id) && typeof value.token === 'string' && /^[\da-f-]{72}$/i.test(value.token);
  const map = new Map((Array.isArray(items) ? items : []).filter(valid).map(value => [value.id, { id: value.id, token: value.token }]));
  if (valid(item)) map.set(item.id, { id: item.id, token: item.token });
  return [...map.values()];
}
