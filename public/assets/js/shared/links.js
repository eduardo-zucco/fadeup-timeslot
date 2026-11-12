export function managementLink(booking) { return `${location.origin}${location.pathname}#reserva=${booking.id}.${booking.token}`; }
export async function copyLink(booking, input, notify) {
  try { await navigator.clipboard.writeText(managementLink(booking)); notify('Link copiado. Guarde-o em um lugar seguro.', true); }
  catch { if (input) { input.focus(); input.select(); } notify('Selecione e copie o link de gerenciamento abaixo.'); }
}
