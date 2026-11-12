export const defaults = {
  name: 'fadeUp Barbearia', open: 540, close: 1080, interval: 0,
  days: [1, 2, 3, 4, 5, 6],
  services: [
    { id: 'corte', name: 'Corte', price: 4000, duration: 30 },
    { id: 'barba', name: 'Barba', price: 3000, duration: 30 },
    { id: 'combo', name: 'Corte + barba', price: 6500, duration: 60 },
  ],
};

export class ValidationError extends Error {
  constructor(message, fields = {}) { super(message); this.fields = fields; }
}

export const time = minutes => `${Math.floor(minutes / 60)}`.padStart(2, '0') + ':' + `${minutes % 60}`.padStart(2, '0');
export const todayInSaoPaulo = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);

export function isCalendarDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T12:00:00Z');
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === date;
}

export function dateOK(date, now = new Date()) {
  if (!isCalendarDate(date)) return false;
  const last = todayInSaoPaulo(new Date(+now + 90 * 86400000));
  return date >= todayInSaoPaulo(now) && date <= last;
}

export function agendaRangeOK(date, end) {
  return isCalendarDate(date) && isCalendarDate(end) && end >= date &&
    (+new Date(end + 'T12:00:00Z') - +new Date(date + 'T12:00:00Z')) <= 30 * 86400000;
}

export function cells(start, duration, interval = 0) {
  return Array.from({ length: Math.ceil((duration + interval) / 15) }, (_, i) => start + i * 15);
}

export function available(date, duration, config, occupied = [], now = new Date()) {
  if (!dateOK(date, now) || !config.days.includes(new Date(date + 'T12:00:00-03:00').getUTCDay())) return [];
  const used = new Set(occupied);
  const slots = [];
  for (let minute = config.open; minute + duration + config.interval <= config.close; minute += 15) {
    if (+new Date(`${date}T${time(minute)}:00-03:00`) <= +now) continue;
    if (cells(minute, duration, config.interval).every(value => !used.has(value))) slots.push(minute);
  }
  return slots;
}

export function customer(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Informe seu nome, entre 2 e 80 caracteres.';
  if (!/^(?:55)?\d{10,11}$/.test(phone)) errors.phone = 'Informe um telefone com DDD, por exemplo (14) 99999-9999.';
  if (body.consent !== true) errors.consent = 'Autorize o uso dos dados para administrar a reserva.';
  if (Object.keys(errors).length) throw new ValidationError('Confira os campos destacados.', errors);
  return { name, phone };
}

export function validConfig(config) {
  return !!config && typeof config.name === 'string' && config.name.trim().length > 1 && config.name.length <= 80 &&
    Number.isInteger(config.open) && Number.isInteger(config.close) && config.open >= 0 && config.close <= 1440 &&
    config.open % 15 === 0 && config.close % 15 === 0 && config.close > config.open && [0, 15, 30].includes(config.interval) &&
    Array.isArray(config.days) && config.days.length > 0 && config.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) &&
    Array.isArray(config.services) && config.services.length > 0 && config.services.length <= 20 &&
    config.services.every(service =>
      !!service && typeof service.id === 'string' && /^[a-z0-9-]{1,30}$/.test(service.id) && typeof service.name === 'string' &&
      service.name.trim().length > 1 && service.name.length <= 80 && Number.isInteger(service.price) && service.price >= 0 &&
      service.price <= 1000000 && [15, 30, 45, 60, 75, 90, 120].includes(service.duration)) &&
    new Set(config.services.map(service => service.id)).size === config.services.length;
}
