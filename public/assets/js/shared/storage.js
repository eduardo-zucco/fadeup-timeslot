import { mergeReservationKeys } from './format.js';
export function createReservationStore(notify) {
  let keys = [];
  try { keys = mergeReservationKeys(JSON.parse(localStorage.getItem('fadeup-reservas') || '[]')); } catch {}
  return {
    get keys() { return keys; },
    remember(booking) {
      keys = mergeReservationKeys(keys, booking);
      try { localStorage.setItem('fadeup-reservas', JSON.stringify(keys)); }
      catch { notify('Este navegador não salvou a reserva. Copie o link de gerenciamento para acessar depois.'); }
    },
  };
}
