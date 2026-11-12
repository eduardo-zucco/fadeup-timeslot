import { agendaPage } from './templates.js';
import { esc, clock, today, dateLabel, shiftDate } from '../shared/format.js';
import { confirmAction } from '../shared/dialog.js';
import { createLoginView } from './login.js';
import { createSettingsView } from './settings.js';
import { createBlockView } from './blocks.js';
export function createAdminFeature(context) {
  const { state, app, api, notice, task } = context;
  const $ = context.$;
  const chooseView = context.navigate;
  const renderLogin = createLoginView(context);
  const renderConfig = createSettingsView(context);
  const blockForm = createBlockView(context);
  const renderBook = focus => context.booking.render(focus);
  async function renderAdmin() {
    if (!state.authenticated) { renderLogin(); return; }
    const current = ++state.revision;
    const end = state.week ? shiftDate(state.agendaDate, 6) : state.agendaDate;
    app.innerHTML = '<section class="content-panel"><h2 id="section-title">Agenda da barbearia</h2><div class="loading-state"><span class="spinner" aria-hidden="true"></span>Consultando agenda…</div></section>';
    let data;
    try { data = await api(`admin/agenda?date=${state.agendaDate}&end=${end}`); }
    catch (error) {
      if (error.status === 403) { context.session.clear(); state.authenticated = false; renderLogin(); return; }
      if (current !== state.revision || state.view !== 'admin') return;
      app.innerHTML = `<section class="content-panel"><h2 id="section-title">Agenda indisponível</h2><p class="sub">${esc(error.message)}</p><button id="retry-agenda" class="primary">Tentar novamente</button></section>`;
      $('#retry-agenda').onclick = () => task(renderAdmin);
      return;
    }
    if (current !== state.revision || state.view !== 'admin') return;
    const active = data.records.filter(booking => booking.status === 'confirmed');
    const appointments = active.filter(booking => booking.kind === 'appointment');
    const blocks = active.filter(booking => booking.kind === 'block');
    const filter = state.agendaFilter || 'active';
    const records = data.records.filter(booking => filter === 'all' || (filter === 'cancelled' ? booking.status === 'cancelled' : booking.status === 'confirmed')).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
    const dates = [...new Set(records.map(booking => booking.date))];
    app.innerHTML = agendaPage({ state, end, appointments, blocks, filter, records, dates, signedIn: Boolean(context.session.key) });
    $('#config').onclick = () => { state.revision++; renderConfig(); };
    if (context.session.key) $('#logout').onclick = async () => {
      context.session.clear(); state.authenticated = false;
      await task(async () => { chooseView('admin'); });
    };
    const navigate = days => { state.agendaDate = shiftDate(state.agendaDate, days); task(renderAdmin); };
    $('#prev').onclick = () => navigate(state.week ? -7 : -1);
    $('#following').onclick = () => navigate(state.week ? 7 : 1);
    $('#today').onclick = () => { state.agendaDate = today(); task(renderAdmin); };
    $('#agenda-date').onchange = () => { if ($('#agenda-date').reportValidity()) { state.agendaDate = $('#agenda-date').value; task(renderAdmin); } };
    $('#period').onchange = () => { state.week = $('#period').value === 'week'; task(renderAdmin); };
    $('#agenda-filter').onchange = () => { state.agendaFilter = $('#agenda-filter').value; task(renderAdmin); };
    $('#manual').onclick = () => {
      notice(''); state.revision++; state.manual = true; state.editing = null; state.step = 1; state.service = null; state.start = null;
      state.draft = { name: '', phone: '', consent: false };
      state.date = state.agendaDate >= today() && state.agendaDate <= shiftDate(today(), 90) ? state.agendaDate : today();
      renderBook(true);
    };
    $('#block').onclick = () => { notice(''); state.revision++; blockForm(); };
    app.querySelectorAll('[data-admin-cancel]').forEach(button => button.onclick = () => {
      const booking = records.find(item => item.id === button.dataset.adminCancel);
      confirmAction(`${booking.kind === 'block' ? 'Liberar intervalo' : 'Cancelar atendimento'} de ${dateLabel(booking.date)} às ${clock(booking.start)}?`, async () => {
        await api('admin/bookings/' + booking.id, { method: 'DELETE' });
        await renderAdmin(); notice('Item cancelado e horário liberado.', true);
      });
    });
  }

  return { render: renderAdmin, login: renderLogin };

}
