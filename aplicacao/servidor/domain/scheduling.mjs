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

