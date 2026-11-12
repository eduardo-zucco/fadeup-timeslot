import { historyPage } from './templates.js';
import { esc, clock, dateLabel, canManage } from '../shared/format.js';
import { confirmAction } from '../shared/dialog.js';
import { managementLink, copyLink } from '../shared/links.js';
export function createHistoryFeature(context) {
  const { state, app, api, notice, task } = context;
  const $ = context.$;
  const chooseView = context.navigate;
  async function renderHistory() {
    const current = ++state.revision;
    const group = state.historyGroup || 'upcoming';
    app.innerHTML = '<div class="content-panel"><h2 id="section-title">Meus agendamentos</h2><div class="loading-state"><span class="spinner" aria-hidden="true"></span>Consultando reservas salvas…</div></div>';
    const results = await Promise.allSettled(context.reservations.keys.map(async key => ({ ...await api('bookings/' + key.id, { headers: { 'X-Booking-Token': key.token } }), token: key.token })));
    if (current !== state.revision || state.view !== 'history') return;
    const rows = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    const failures = results.filter(result => result.status === 'rejected').length;
    const groups = {
      upcoming: rows.filter(booking => canManage(booking)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start),
      past: rows.filter(booking => booking.status === 'confirmed' && !canManage(booking)).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start),
      cancelled: rows.filter(booking => booking.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start)
    };
    app.innerHTML = historyPage({ state, group, failures, groups });
    $('#book-another').onclick = () => { state.service = null; chooseView('book'); };
    if (failures) $('#retry-history').onclick = () => task(renderHistory);
    app.querySelectorAll('[data-group]').forEach(button => button.onclick = () => { state.historyGroup = button.dataset.group; task(renderHistory); });
    app.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => {
      state.editing = rows.find(booking => booking.id === button.dataset.edit);
      state.step = 2; state.date = state.editing.date; state.start = null;
      context.booking.render(true);
    });
    app.querySelectorAll('[data-cancel]').forEach(button => button.onclick = () => {
      const booking = rows.find(item => item.id === button.dataset.cancel);
      confirmAction(`Cancelar ${booking.service} de ${dateLabel(booking.date)} às ${clock(booking.start)}?`, async () => {
        await api('bookings/' + booking.id, { method: 'DELETE', headers: { 'X-Booking-Token': booking.token } });
        await renderHistory(); notice('Reserva cancelada. O horário foi liberado.', true);
      });
    });
    app.querySelectorAll('[data-link]').forEach(button => button.onclick = () => {
      const booking = rows.find(item => item.id === button.dataset.link);
      $('#reservation-link').innerHTML = `<div class="link-card"><label class="field">Link de gerenciamento<span class="hint">Este link dá acesso à reserva. Compartilhe apenas com quem poderá gerenciá-la.</span><span class="link-field"><input id="history-link" readonly value="${esc(managementLink(booking))}"><button class="secondary" id="copy-history">Copiar</button></span></label></div>`;
      $('#copy-history').onclick = () => copyLink(booking, $('#history-link'), notice);
      $('#history-link').focus();
    });
  }

  return { render: renderHistory };

}
