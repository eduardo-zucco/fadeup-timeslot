import { time } from './scheduling.mjs';

// Queue records only. External delivery remains outside this MVP.
export function notifications(booking, types, now) {
  return types.map(type => ({
    id: crypto.randomUUID(), booking: booking.id, type, created: now,
    scheduled: type === 'reminder'
      ? new Date(+new Date(`${booking.date}T${time(booking.start)}:00-03:00`) - 7200000).toISOString()
      : now,
  }));
}
