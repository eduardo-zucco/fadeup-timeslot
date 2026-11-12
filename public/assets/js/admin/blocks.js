import { blockPage } from './blocks-template.js';
import { clock, today, shiftDate } from '../shared/format.js';
export function createBlockView(context) {
  const { state, app, api, notice, task, submit, focusTitle } = context;
  const $ = context.$;
  function blockForm() {
    const date = state.agendaDate >= today() && state.agendaDate <= shiftDate(today(), 90) ? state.agendaDate : today();
    app.innerHTML = blockPage({ date });
    const form = $('#block-form');
    let request = 0;
    async function load() {
      const current = ++request;
      form.elements.start.disabled = true;
      form.querySelector('[type=submit]').disabled = true;
      form.elements.start.innerHTML = '<option value="">Buscando horários…</option>';
      $('#retry-block').hidden = true;
      $('#block-hint').textContent = '';
      if (!form.elements.date.reportValidity()) return;
      try {
        const data = await api(`admin/slots?date=${form.elements.date.value}&duration=${form.elements.duration.value}`);
        if (!form.isConnected || request !== current) return;
        form.elements.start.innerHTML = '<option value="">Selecione o início</option>' + data.slots.map(value => `<option value="${value}">${clock(value)}</option>`).join('');
        form.elements.start.disabled = !data.slots.length;
        $('#block-hint').textContent = data.slots.length ? 'Apenas horários livres para a duração escolhida.' : 'Sem intervalos livres. Escolha outra data ou duração.';
      } catch (error) {
        if (!form.isConnected || request !== current) return;
        form.elements.start.innerHTML = '<option value="">Horários indisponíveis</option>';
        $('#block-hint').textContent = error.message;
        $('#retry-block').hidden = false;
      }
    }
    form.elements.date.onchange = load;
    form.elements.duration.onchange = load;
    form.elements.start.onchange = () => { form.querySelector('[type=submit]').disabled = form.elements.start.value === ''; };
    $('#retry-block').onclick = load;
    $('#back').onclick = () => task(context.admin.render);
    form.onsubmit = event => {
      event.preventDefault();
      submit(form.querySelector('[type=submit]'), async () => {
        try {
          await api('admin/bookings', { method: 'POST', body: JSON.stringify({ kind: 'block', name: form.elements.name.value, date: form.elements.date.value, start: Number(form.elements.start.value), duration: Number(form.elements.duration.value) }) });
          state.agendaDate = form.elements.date.value;
          await context.admin.render(); notice('Intervalo bloqueado.', true);
        } catch (error) { if (error.status === 409) await load(); throw error; }
      });
    };
    load(); focusTitle();
  }

  return blockForm;

}
