import { serviceStep, timeStep, customerStep, confirmationStep } from './templates.js';
import { esc, money, clock, dateLabel } from '../shared/format.js';
import { managementLink, copyLink } from '../shared/links.js';
export function createBookingFeature(context) {
  const { state, app, api, notice, task, submit, focusTitle, heading } = context;
  const $ = context.$;
  const chooseView = context.navigate;
  const stepper = () => `<ol class="steps" aria-label="Etapas do agendamento">${['Serviço', 'Horário', 'Seus dados', 'Confirmação'].map((name, index) => `<li class="${state.step === index + 1 ? 'current' : state.step > index + 1 ? 'complete' : ''}" ${state.step === index + 1 ? 'aria-current="step"' : ''}><b aria-hidden="true">${state.step > index + 1 ? '✓' : index + 1}</b>${name}</li>`).join('')}</ol>`;
  function currentService() { return state.editing ? { name: state.editing.service, duration: state.editing.duration, price: state.editing.price } : state.service; }
  function summary() {
    const service = currentService();
    return `<aside class="summary-panel" aria-label="Resumo do agendamento"><p class="summary-label">Sua reserva</p>${service ? `<h3 class="summary-service">${esc(service.name)}</h3><span class="summary-duration">${service.duration} minutos de atendimento</span><div class="summary-date">${state.step >= 2 ? esc(dateLabel(state.date)) : 'Escolha a data na próxima etapa'}<br><strong>${state.start !== null ? clock(state.start) : 'Horário a definir'}</strong></div><div class="summary-total"><span>Total do serviço</span><strong>${money(service.price)}</strong></div>` : '<p class="summary-placeholder">Escolha um serviço para começar.<br>O seu resumo aparece aqui.</p>'}<p class="summary-note"><strong>Pagamento no estabelecimento.</strong><br>${state.manual ? 'O atendimento será gerenciado pelo painel da barbearia.' : 'Guarde o link da confirmação para gerenciar sua reserva.'}</p></aside>`;
  }
  function updateSummary() { const old = $('.summary-panel'); if (old) old.outerHTML = summary(); }
  function shell(content) { app.removeAttribute('aria-busy'); app.innerHTML = `<div class="booking-layout"><section class="flow-panel">${stepper()}${content}</section>${summary()}</div>`; heading(); }
  function renderBook(focus = false) {
    const service = currentService();
    if (state.step === 1) {
      shell(serviceStep({ state, service: currentService(), draft: state.draft, managementLink }));
      app.querySelectorAll('[data-service]').forEach(button => button.onclick = () => {
        state.service = state.config.services.find(item => item.id === button.dataset.service);
        state.start = null;
        renderBook();
        app.querySelector(`[data-service="${CSS.escape(state.service.id)}"]`).focus();
      });
      $('#next').onclick = () => { state.step = 2; renderBook(true); };
    } else if (state.step === 2) {
      shell(timeStep({ state, service: currentService(), draft: state.draft, managementLink }));
      const changeDate = value => { state.date = value; state.start = null; renderBook(); $('#date').focus(); };
      $('#date').onchange = () => { if ($('#date').reportValidity()) changeDate($('#date').value); };
      app.querySelectorAll('[data-date]').forEach(button => button.onclick = () => changeDate(button.dataset.date));
      $('#back').onclick = () => { if (state.editing) chooseView('history'); else { state.step = 1; state.start = null; renderBook(true); } };
      $('#next').onclick = event => {
        if (!state.editing) { state.step = 3; renderBook(true); return; }
        const booking = state.editing;
        submit(event.currentTarget, async () => {
          try {
            await api('bookings/' + booking.id, { method: 'PATCH', headers: { 'X-Booking-Token': booking.token }, body: JSON.stringify({ date: state.date, start: state.start }) });
            chooseView('history');
            notice('Horário atualizado. O serviço e o valor foram mantidos.', true);
          } catch (error) { if (error.status === 409) { state.start = null; renderBook(true); } throw error; }
        });
      };
      task(loadSlots);
    } else if (state.step === 3) {
      const draft = state.draft;
      shell(customerStep({ state, service: currentService(), draft: state.draft, managementLink }));
      const form = $('#customer');
      const saveDraft = () => { state.draft = { name: form.elements.name.value, phone: form.elements.phone.value, consent: form.elements.consent.checked }; };
      form.oninput = saveDraft;
      form.onchange = saveDraft;
      $('#back').onclick = () => { saveDraft(); state.step = 2; renderBook(true); };
      form.onsubmit = event => {
        event.preventDefault(); saveDraft(); notice('');
        submit(form.querySelector('[type=submit]'), async () => {
          try {
            const booking = await api((state.manual ? 'admin/' : '') + 'bookings', { method: 'POST', body: JSON.stringify({ service: service.id, date: state.date, start: state.start, ...state.draft }) });
            state.draft = { name: '', phone: '', consent: false };
            if (state.manual) { state.agendaDate = booking.date; chooseView('admin'); notice('Encaixe confirmado na agenda.', true); return; }
            context.reservations.remember(booking); state.step = 4; confirmation(booking);
          } catch (error) {
            if (error.status === 409) { state.start = null; state.step = 2; renderBook(true); }
            else if (error.fields) {
              for (const name of ['name', 'phone', 'consent']) {
                form.elements[name].setAttribute('aria-invalid', String(Boolean(error.fields[name])));
                form.elements[name].setAttribute('aria-describedby', 'error-' + name);
                $('#error-' + name).textContent = error.fields[name] || '';
              }
              form.querySelector('[aria-invalid=true]')?.focus();
            }
            throw error;
          }
        });
      };
    }
    if (focus) focusTitle();
  }
  async function loadSlots() {
    const request = ++state.slotRequest;
    const area = $('#slot-area');
    const next = $('#next');
    area.innerHTML = '<div class="loading-state"><span class="spinner" aria-hidden="true"></span>Buscando horários livres…</div>';
    next.disabled = true;
    const booking = state.editing;
    try {
      const path = booking ? `bookings/${booking.id}/slots?date=${state.date}` : `slots?date=${state.date}&service=${encodeURIComponent(state.service.id)}`;
      const result = await api(path, booking ? { headers: { 'X-Booking-Token': booking.token } } : {});
      if (request !== state.slotRequest || !area.isConnected) return;
      state.slots = result.slots;
      if (!result.slots.includes(state.start)) state.start = null;
      next.disabled = state.start === null;
      area.innerHTML = result.slots.length ? `<div class="slots-heading"><h3>Horários disponíveis</h3><span class="small">${result.slots.length} opções</span></div>` + [[0, 720, 'Manhã'], [720, 1080, 'Tarde'], [1080, 1440, 'Noite']].map(([from, to, label]) => {
        const times = result.slots.filter(value => value >= from && value < to);
        return times.length ? `<div class="slot-group"><p class="slot-group-label">${label}</p><div class="slots">${times.map(value => `<button class="slot ${value === state.start ? 'selected' : ''}" data-time="${value}" aria-pressed="${value === state.start}">${clock(value)}</button>`).join('')}</div></div>` : '';
      }).join('') : '<div class="empty-state"><strong>Sem horários livres nesta data.</strong>Escolha outro dia para encontrar um horário para você.</div>';
      area.querySelectorAll('[data-time]').forEach(button => button.onclick = () => {
        state.start = Number(button.dataset.time);
        area.querySelectorAll('[data-time]').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); });
        next.disabled = false;
        updateSummary();
      });
      updateSummary();
    } catch (error) {
      if (request !== state.slotRequest || !area.isConnected) return;
      area.innerHTML = `<div class="empty-state"><strong>Não foi possível buscar os horários.</strong>${esc(error.message)}<br><button class="text-button" id="retry-slots">Tentar novamente</button></div>`;
      $('#retry-slots').onclick = () => task(loadSlots);
    }
  }
  function confirmation(booking) {
      shell(confirmationStep({ state, service: currentService(), draft: state.draft, booking, managementLink }));
    $('#copy').onclick = () => copyLink(booking, $('#manage-link'), notice);
    $('#new-booking').onclick = () => { state.service = null; chooseView('book'); };
    $('#history').onclick = () => chooseView('history');
    focusTitle();
  }

  return { render: renderBook };

}
