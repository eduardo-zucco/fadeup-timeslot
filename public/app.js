import { esc, money, clock, today, dateLabel, shiftDate, canManage, mergeReservationKeys } from '/ui-utils.js';
const $ = selector => document.querySelector(selector);
const app = $('#app');
let adminKey = '';
try { adminKey = sessionStorage.getItem('fadeup-admin') || ''; } catch {}
const state = { config: null, view: 'book', step: 1, service: null, date: today(), start: null, slots: [], editing: null, manual: false, agendaDate: today(), week: false, draft: { name: '', phone: '', consent: false } };
let saved = [];
try { saved = mergeReservationKeys(JSON.parse(localStorage.getItem('fadeup-reservas') || '[]')); } catch {}
let revision = 0;
let slotRequest = 0;
let submitting = false;
function persist() {
  try { localStorage.setItem('fadeup-reservas', JSON.stringify(saved)); }
  catch { notice('Este navegador não salvou a reserva. Copie o link de gerenciamento para acessar depois.'); }
}
function notice(text, ok = false) {
  $('#notice').innerHTML = text ? `<div class="alert ${ok ? 'ok' : ''}"><span>${esc(text)}</span><button aria-label="Fechar aviso">×</button></div>` : '';
  if (text) $('#notice button').onclick = () => notice('');
}
async function api(path, options = {}) {
  let response;
  try { response = await fetch('/api/' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(adminKey ? { 'X-Admin-Key': adminKey } : {}), ...options.headers } }); }
  catch { throw new Error('Sem conexão com a agenda. Verifique sua conexão e tente novamente.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('A agenda não respondeu como esperado. Tente novamente.'); }
  if (!response.ok) {
    const error = new Error(data.error || 'Não foi possível concluir.');
    error.status = response.status;
    error.fields = data.fields;
    throw error;
  }
  return data;
}
async function task(fn) { try { await fn(); } catch (error) { notice(error.message); } }
async function submit(button, fn) {
  if (submitting) return;
  submitting = true;
  const controls = [...document.querySelectorAll('nav button, #app button, #app input, #app select')].map(control => [control, control.disabled]);
  controls.forEach(([control]) => { control.disabled = true; });
  button.setAttribute('aria-busy', 'true');
  try { await fn(); } catch (error) { notice(error.message); }
  finally {
    submitting = false;
    controls.forEach(([control, disabled]) => { if (control.isConnected) control.disabled = disabled; });
    if (button.isConnected) button.removeAttribute('aria-busy');
  }
}
function focusTitle() { const title = $('#section-title'); if (title) { title.tabIndex = -1; title.focus(); } }
function heading() {
  const content = state.manual ? ['ENCAIXE MANUAL', 'Encontre espaço na sua agenda.', 'Cadastre um atendimento com os mesmos horários livres do cliente.'] : state.editing ? ['REAGENDAMENTO', 'Vamos encontrar um novo horário.', 'O serviço e o valor da reserva original são mantidos.'] : {
    book: ['FAÇA SUA RESERVA', 'Um horário que combina com você.', 'Escolha o serviço e reserve em poucos passos.'],
    history: ['MEUS AGENDAMENTOS', 'Seu próximo encontro está aqui.', 'Consulte, reagende ou cancele suas reservas.'],
    admin: ['PAINEL DA BARBEARIA', 'Sua agenda, em ordem.', 'Atendimentos, pausas e configurações em um só lugar.']
  }[state.view];
  $('#section-label').textContent = content[0];
  $('#page-title').textContent = content[1];
  $('#page-description').textContent = content[2];
}
function chooseView(view) {
  revision++;
  slotRequest++;
  state.view = view;
  state.editing = null;
  state.manual = false;
  notice('');
  document.querySelectorAll('nav button').forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  });
  heading();
  if (view === 'book') { state.step = 1; state.start = null; renderBook(); }
  if (view === 'history') task(renderHistory);
  if (view === 'admin') task(renderAdmin);
}
document.querySelectorAll('nav button').forEach(button => button.onclick = () => chooseView(button.dataset.view));
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
    shell(`<h2 id="section-title">O que vamos fazer hoje?</h2><p class="sub">Escolha um serviço. O preço e a duração já estão definidos.</p><div class="services">${state.config.services.map((item, index) => `<button class="service ${state.service?.id === item.id ? 'selected' : ''}" data-service="${esc(item.id)}" aria-pressed="${state.service?.id === item.id}"><span class="service-icon" aria-hidden="true">${index === 0 ? '✂' : index === 1 ? '◇' : '＋'}</span><span class="service-copy"><strong>${esc(item.name)}</strong><small>${item.duration} minutos</small></span><span class="service-price">${money(item.price)}<span class="service-check">${state.service?.id === item.id ? '✓ Selecionado' : 'Selecionar'}</span></span></button>`).join('')}</div><div class="actions"><p class="trust-note">Reserva sem pagamento antecipado</p><button class="primary" id="next" ${!service ? 'disabled' : ''}>Escolher horário →</button></div>`);
    app.querySelectorAll('[data-service]').forEach(button => button.onclick = () => {
      state.service = state.config.services.find(item => item.id === button.dataset.service);
      state.start = null;
      renderBook();
      app.querySelector(`[data-service="${CSS.escape(state.service.id)}"]`).focus();
    });
    $('#next').onclick = () => { state.step = 2; renderBook(true); };
  } else if (state.step === 2) {
    shell(`<h2 id="section-title">Qual horário combina com você?</h2><p class="sub">${esc(service.name)} · ${service.duration} min. Os horários refletem a disponibilidade atual.</p><label class="field">Data<input id="date" type="date" min="${today()}" max="${shiftDate(today(), 90)}" value="${state.date}" required></label><div class="date-shortcuts">${['Hoje', 'Amanhã', dateLabel(shiftDate(today(), 2))].map((label, index) => `<button data-date="${shiftDate(today(), index)}" class="${state.date === shiftDate(today(), index) ? 'selected' : ''}">${esc(label)}</button>`).join('')}</div><div id="slot-area" aria-live="polite"></div><div class="actions"><button class="text-button" id="back">← ${state.editing ? 'Minhas reservas' : 'Alterar serviço'}</button><button id="next" class="primary" disabled>${state.editing ? 'Salvar novo horário' : 'Continuar →'}</button></div>`);
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
    shell(`<h2 id="section-title">Só faltam seus dados.</h2><p class="sub">Confira seu resumo antes de confirmar a reserva.</p><form id="customer"><label class="field">Seu nome<input name="name" autocomplete="name" minlength="2" maxlength="80" required value="${esc(draft.name)}" placeholder="Como podemos chamar você?"><span class="field-error" id="error-name"></span></label><label class="field">WhatsApp com DDD<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="22" pattern="[+()0-9 .\-]{10,22}" value="${esc(draft.phone)}" placeholder="(14) 99999-9999"><span class="field-error" id="error-phone"></span></label><label class="check"><input name="consent" type="checkbox" required ${draft.consent ? 'checked' : ''}><span>${state.manual ? 'O cliente autorizou o uso do nome e telefone para administrar este agendamento.' : 'Autorizo o uso do nome e telefone para administrar este agendamento.'} Os dados ficam disponíveis ao responsável da barbearia.</span></label><span class="field-error" id="error-consent"></span><p class="small">A confirmação aparece aqui. O envio automático pelo WhatsApp ainda não está disponível.</p><div class="actions"><button type="button" class="text-button" id="back">← Alterar horário</button><button type="submit" class="primary">Confirmar ${money(service.price)} →</button></div></form>`);
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
          saved = mergeReservationKeys(saved, booking); persist(); state.step = 4; confirmation(booking);
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
  const request = ++slotRequest;
  const area = $('#slot-area');
  const next = $('#next');
  area.innerHTML = '<div class="loading-state"><span class="spinner" aria-hidden="true"></span>Buscando horários livres…</div>';
  next.disabled = true;
  const booking = state.editing;
  try {
    const path = booking ? `bookings/${booking.id}/slots?date=${state.date}` : `slots?date=${state.date}&service=${encodeURIComponent(state.service.id)}`;
    const result = await api(path, booking ? { headers: { 'X-Booking-Token': booking.token } } : {});
    if (request !== slotRequest || !area.isConnected) return;
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
    if (request !== slotRequest || !area.isConnected) return;
    area.innerHTML = `<div class="empty-state"><strong>Não foi possível buscar os horários.</strong>${esc(error.message)}<br><button class="text-button" id="retry-slots">Tentar novamente</button></div>`;
    $('#retry-slots').onclick = () => task(loadSlots);
  }
}
function managementLink(booking) { return `${location.origin}${location.pathname}#reserva=${booking.id}.${booking.token}`; }
async function copyLink(booking, input) {
  try { await navigator.clipboard.writeText(managementLink(booking)); notice('Link copiado. Guarde-o em um lugar seguro.', true); }
  catch { if (input) { input.focus(); input.select(); } notice('Selecione e copie o link de gerenciamento abaixo.'); }
}
function confirmation(booking) {
  shell(`<div class="confirmation"><span class="success-symbol" aria-hidden="true">✓</span><h2 id="section-title">Seu horário está reservado!</h2><p class="sub">Tudo certo, ${esc(booking.name)}. Esperamos você no horário combinado.</p><dl class="confirmation-details"><div><dt>Serviço</dt><dd>${esc(booking.service)}</dd></div><div><dt>Valor</dt><dd>${money(booking.price)}</dd></div><div><dt>Data</dt><dd>${dateLabel(booking.date)}</dd></div><div><dt>Horário</dt><dd>${clock(booking.start)} · ${booking.duration} min</dd></div></dl><label class="field">Link para gerenciar a reserva<span class="hint">Este link dá acesso à reserva. Guarde para reagendar ou cancelar.</span><span class="link-field"><input id="manage-link" readonly value="${esc(managementLink(booking))}"><button class="secondary" id="copy">Copiar</button></span></label><div class="actions"><button class="text-button" id="new-booking">Agendar outro →</button><button class="primary" id="history">Minhas reservas</button></div></div>`);
  $('#copy').onclick = () => copyLink(booking, $('#manage-link'));
  $('#new-booking').onclick = () => { state.service = null; chooseView('book'); };
  $('#history').onclick = () => chooseView('history');
  focusTitle();
}
async function renderHistory() {
  const current = ++revision;
  const group = state.historyGroup || 'upcoming';
  app.innerHTML = '<div class="content-panel"><h2 id="section-title">Meus agendamentos</h2><div class="loading-state"><span class="spinner" aria-hidden="true"></span>Consultando reservas salvas…</div></div>';
  const results = await Promise.allSettled(saved.map(async key => ({ ...await api('bookings/' + key.id, { headers: { 'X-Booking-Token': key.token } }), token: key.token })));
  if (current !== revision || state.view !== 'history') return;
  const rows = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  const failures = results.filter(result => result.status === 'rejected').length;
  const groups = {
    upcoming: rows.filter(booking => canManage(booking)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start),
    past: rows.filter(booking => booking.status === 'confirmed' && !canManage(booking)).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start),
    cancelled: rows.filter(booking => booking.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start)
  };
  app.innerHTML = `<section class="content-panel"><div class="section-heading"><div><h2 id="section-title">Meus agendamentos</h2><p class="sub">Reservas salvas neste navegador. Em outro aparelho, abra o link de gerenciamento.</p></div><button class="primary" id="book-another">Agendar novo →</button></div>${failures ? `<div class="alert"><span>${failures} reserva(s) não puderam ser consultadas. Sua chave continua salva neste navegador.</span><button class="text-button" id="retry-history">Tentar novamente</button></div>` : ''}<div class="tabs" aria-label="Filtrar reservas">${[['upcoming', 'Próximos'], ['past', 'Passados'], ['cancelled', 'Cancelados']].map(([key, label]) => `<button data-group="${key}" aria-pressed="${group === key}" class="${group === key ? 'selected' : ''}">${label} <span>${groups[key].length}</span></button>`).join('')}</div>${groups[group].length ? groups[group].map(booking => `<article class="booking-row"><div class="booking-date"><strong>${new Date(booking.date + 'T12:00:00Z').getUTCDate()}</strong><span>${esc(new Date(booking.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }))}</span></div><div class="booking-info"><span class="status ${group === 'upcoming' ? 'confirmed' : ''}">${group === 'upcoming' ? 'Confirmado' : group === 'past' ? 'Passado' : 'Cancelado'}</span><h3>${esc(booking.service)}</h3><p>${esc(dateLabel(booking.date))} · ${clock(booking.start)} · ${booking.duration} min · ${money(booking.price)}</p><p>${esc(booking.name)}</p></div><div class="row-actions">${canManage(booking) ? `<button class="secondary" data-edit="${booking.id}">Reagendar</button><button class="secondary danger" data-cancel="${booking.id}">Cancelar</button>` : ''}<button class="text-button" data-link="${booking.id}">Link da reserva</button></div></article>`).join('') : `<div class="empty-state"><strong>${group === 'upcoming' ? 'Nenhum horário marcado por aqui.' : group === 'past' ? 'Ainda não há reservas passadas.' : 'Nenhuma reserva cancelada.'}</strong>${group === 'upcoming' ? 'Que tal reservar seu próximo atendimento?' : 'Seu histórico aparece nesta aba.'}</div>`}<div id="reservation-link"></div><p class="small history-note">“Passado” indica que o horário já ocorreu; não confirma presença. Para acessar uma reserva em outro aparelho, use o link salvo na confirmação.</p></section>`;
  $('#book-another').onclick = () => { state.service = null; chooseView('book'); };
  if (failures) $('#retry-history').onclick = () => task(renderHistory);
  app.querySelectorAll('[data-group]').forEach(button => button.onclick = () => { state.historyGroup = button.dataset.group; task(renderHistory); });
  app.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => {
    state.editing = rows.find(booking => booking.id === button.dataset.edit);
    state.step = 2; state.date = state.editing.date; state.start = null;
    renderBook(true);
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
    $('#copy-history').onclick = () => copyLink(booking, $('#history-link'));
    $('#history-link').focus();
  });
}
function confirmAction(text, fn) {
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.setAttribute('aria-describedby', 'dialog-description');
  dialog.innerHTML = `<h2 id="dialog-title">${esc(text)}</h2><p class="sub" id="dialog-description">Esta ação libera o horário para outra pessoa. O registro permanece no histórico.</p><div id="dialog-error" role="alert"></div><div class="actions"><button class="secondary" id="keep" autofocus>Manter reserva</button><button class="primary" id="confirm">Confirmar cancelamento</button></div>`;
  document.body.append(dialog);
  dialog.onclose = () => dialog.remove();
  dialog.showModal();
  dialog.querySelector('#keep').onclick = () => dialog.close();
  dialog.querySelector('#confirm').onclick = async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    dialog.querySelector('#keep').disabled = true;
    dialog.oncancel = event => event.preventDefault();
    try { await fn(); dialog.close(); }
    catch (error) { dialog.querySelector('#dialog-error').textContent = error.message; }
    finally {
      if (dialog.isConnected) { button.disabled = false; dialog.querySelector('#keep').disabled = false; dialog.oncancel = null; }
    }
  };
}

function renderLogin() {
  app.innerHTML = '<section class="content-panel login-panel"><h2 id="section-title">Acesso da barbearia</h2><p class="sub">Use a chave administrativa do negócio para acessar a agenda e as configurações.</p><form id="login"><label class="field">Chave administrativa<input name="key" type="password" minlength="24" autocomplete="off" required></label><div class="actions"><button class="primary" type="submit">Entrar no painel</button></div></form></section>';
  $('#login').onsubmit = event => {
    event.preventDefault();
    const form = event.target;
    submit(form.querySelector('[type=submit]'), async () => {
      const previousKey = adminKey;
      adminKey = form.elements.key.value;
      try {
        const config = await api('config');
        if (!config.admin) throw new Error('Chave inválida. Confira e tente novamente.');
        try { sessionStorage.setItem('fadeup-admin', adminKey); } catch {}
        state.config = config;
        await renderAdmin();
      } catch (error) { adminKey = previousKey; throw error; }
    });
  };
}
async function renderAdmin() {
  if (!state.config.admin) { renderLogin(); return; }
  const current = ++revision;
  const end = state.week ? shiftDate(state.agendaDate, 6) : state.agendaDate;
  app.innerHTML = '<section class="content-panel"><h2 id="section-title">Agenda da barbearia</h2><div class="loading-state"><span class="spinner" aria-hidden="true"></span>Consultando agenda…</div></section>';
  let data;
  try { data = await api(`admin/agenda?date=${state.agendaDate}&end=${end}`); }
  catch (error) {
    if (current !== revision || state.view !== 'admin') return;
    app.innerHTML = `<section class="content-panel"><h2 id="section-title">Agenda indisponível</h2><p class="sub">${esc(error.message)}</p><button id="retry-agenda" class="primary">Tentar novamente</button></section>`;
    $('#retry-agenda').onclick = () => task(renderAdmin);
    return;
  }
  if (current !== revision || state.view !== 'admin') return;
  const active = data.records.filter(booking => booking.status === 'confirmed');
  const appointments = active.filter(booking => booking.kind === 'appointment');
  const blocks = active.filter(booking => booking.kind === 'block');
  const filter = state.agendaFilter || 'active';
  const records = data.records.filter(booking => filter === 'all' || (filter === 'cancelled' ? booking.status === 'cancelled' : booking.status === 'confirmed')).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const dates = [...new Set(records.map(booking => booking.date))];
  app.innerHTML = `<section class="content-panel"><div class="section-heading"><div><h2 id="section-title">Agenda da barbearia</h2><p class="sub">${esc(dateLabel(state.agendaDate))}${state.week ? ' a ' + esc(dateLabel(end)) : ''} · Horários de Brasília</p></div><div class="row-actions"><button class="secondary" id="config">Configurações</button>${adminKey ? '<button class="text-button" id="logout">Sair</button>' : ''}</div></div><div class="agenda-toolbar"><div class="calendar-nav"><button class="secondary" id="prev" aria-label="Período anterior">←</button><button class="secondary" id="today">Hoje</button><button class="secondary" id="following" aria-label="Próximo período">→</button></div><label class="field">Data inicial<input id="agenda-date" type="date" value="${state.agendaDate}" required></label><label class="field">Visualização<select id="period"><option value="day">Dia</option><option value="week" ${state.week ? 'selected' : ''}>Semana</option></select></label><div class="row-actions agenda-add"><button class="secondary" id="block">Bloquear horário</button><button class="primary" id="manual">＋ Novo encaixe</button></div></div><div class="agenda-stats"><div><span>Atendimentos confirmados</span><strong>${appointments.length}</strong></div><div><span>Intervalos bloqueados</span><strong>${blocks.length}</strong></div><div><span>Valor previsto</span><strong>${money(appointments.reduce((total, booking) => total + booking.price, 0))}</strong></div></div><div class="list-heading"><h3>${state.week ? 'Atendimentos da semana' : 'Atendimentos do dia'}</h3><label class="field">Exibir<select id="agenda-filter"><option value="active">Ativos</option><option value="all" ${filter === 'all' ? 'selected' : ''}>Todos</option><option value="cancelled" ${filter === 'cancelled' ? 'selected' : ''}>Cancelados</option></select></label></div>${records.length ? dates.map(date => `<section class="agenda-day" aria-label="${esc(dateLabel(date))}">${state.week ? `<h3 class="day-label">${esc(dateLabel(date))}</h3>` : ''}${records.filter(booking => booking.date === date).map(booking => `<article class="booking-row ${booking.kind === 'block' ? 'blocked-row' : ''}"><div class="time-badge"><strong>${clock(booking.start)}</strong><span>${clock(booking.start + booking.duration)}</span></div><div class="booking-info"><span class="status ${booking.status === 'confirmed' && booking.kind !== 'block' ? 'confirmed' : ''}">${booking.status !== 'confirmed' ? 'Cancelado' : booking.kind === 'block' ? 'Bloqueio' : 'Confirmado'}</span><h3>${esc(booking.name)}</h3><p>${esc(booking.service)} · ${booking.duration} min${booking.phone ? ' · ' + esc(booking.phone) : ''}</p></div><div class="row-actions">${booking.kind === 'appointment' ? `<span class="booking-value">${money(booking.price)}</span>` : ''}${canManage(booking) ? `<button class="secondary danger" data-admin-cancel="${booking.id}">${booking.kind === 'block' ? 'Liberar' : 'Cancelar'}</button>` : ''}</div></article>`).join('')}</section>`).join('') : `<div class="empty-state"><strong>${filter === 'cancelled' ? 'Nenhum cancelamento neste período.' : 'Nenhum item para mostrar neste período.'}</strong>Use a navegação para consultar outro dia ou cadastre um encaixe.</div>`}<p class="small history-note">O valor previsto considera os atendimentos confirmados do período e não representa pagamentos recebidos.</p></section>`;
  $('#config').onclick = () => { revision++; renderConfig(); };
  if (adminKey) $('#logout').onclick = async () => {
    adminKey = ''; try { sessionStorage.removeItem('fadeup-admin'); } catch {}
    await task(async () => { state.config = await api('config'); chooseView('admin'); });
  };
  const navigate = days => { state.agendaDate = shiftDate(state.agendaDate, days); task(renderAdmin); };
  $('#prev').onclick = () => navigate(state.week ? -7 : -1);
  $('#following').onclick = () => navigate(state.week ? 7 : 1);
  $('#today').onclick = () => { state.agendaDate = today(); task(renderAdmin); };
  $('#agenda-date').onchange = () => { if ($('#agenda-date').reportValidity()) { state.agendaDate = $('#agenda-date').value; task(renderAdmin); } };
  $('#period').onchange = () => { state.week = $('#period').value === 'week'; task(renderAdmin); };
  $('#agenda-filter').onchange = () => { state.agendaFilter = $('#agenda-filter').value; task(renderAdmin); };
  $('#manual').onclick = () => {
    notice(''); revision++; state.manual = true; state.editing = null; state.step = 1; state.service = null; state.start = null;
    state.draft = { name: '', phone: '', consent: false };
    state.date = state.agendaDate >= today() && state.agendaDate <= shiftDate(today(), 90) ? state.agendaDate : today();
    renderBook(true);
  };
  $('#block').onclick = () => { notice(''); revision++; blockForm(); };
  app.querySelectorAll('[data-admin-cancel]').forEach(button => button.onclick = () => {
    const booking = records.find(item => item.id === button.dataset.adminCancel);
    confirmAction(`${booking.kind === 'block' ? 'Liberar intervalo' : 'Cancelar atendimento'} de ${dateLabel(booking.date)} às ${clock(booking.start)}?`, async () => {
      await api('admin/bookings/' + booking.id, { method: 'DELETE' });
      await renderAdmin(); notice('Item cancelado e horário liberado.', true);
    });
  });
}
function blockForm() {
  const date = state.agendaDate >= today() && state.agendaDate <= shiftDate(today(), 90) ? state.agendaDate : today();
  app.innerHTML = `<section class="content-panel form-panel"><h2 id="section-title">Bloquear um intervalo</h2><p class="sub">Escolha uma pausa entre os horários livres. O intervalo ficará indisponível para reservas.</p><form id="block-form"><label class="field">Motivo<input name="name" minlength="2" maxlength="80" required placeholder="Ex.: pausa para almoço"></label><div class="form-grid"><label class="field">Data<input type="date" name="date" min="${today()}" max="${shiftDate(today(), 90)}" value="${date}" required></label><label class="field">Duração<select name="duration">${[15, 30, 45, 60, 90, 120].map(value => `<option value="${value}">${value} minutos</option>`).join('')}</select></label></div><label class="field">Início<select name="start" required disabled><option value="">Buscando horários…</option></select><span class="hint" id="block-hint" aria-live="polite"></span></label><button type="button" class="text-button" id="retry-block" hidden>Tentar buscar horários novamente</button><div class="actions"><button type="button" class="secondary" id="back">Voltar à agenda</button><button class="primary" type="submit" disabled>Criar bloqueio</button></div></form></section>`;
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
  $('#back').onclick = () => task(renderAdmin);
  form.onsubmit = event => {
    event.preventDefault();
    submit(form.querySelector('[type=submit]'), async () => {
      try {
        await api('admin/bookings', { method: 'POST', body: JSON.stringify({ kind: 'block', name: form.elements.name.value, date: form.elements.date.value, start: Number(form.elements.start.value), duration: Number(form.elements.duration.value) }) });
        state.agendaDate = form.elements.date.value;
        await renderAdmin(); notice('Intervalo bloqueado.', true);
      } catch (error) { if (error.status === 409) await load(); throw error; }
    });
  };
  load(); focusTitle();
}
function renderConfig() {
  const original = state.config;
  const services = original.services.map(service => ({ ...service }));
  app.innerHTML = `<section class="content-panel form-panel"><h2 id="section-title">Configurações da barbearia</h2><p class="sub">As mudanças valem para novas reservas. Atendimentos existentes mantêm serviço, valor e duração.</p><form id="config-form"><label class="field">Nome do negócio<input name="name" value="${esc(original.name)}" minlength="2" maxlength="80" required></label><div class="form-grid"><label class="field">Abre às<input name="open" type="time" step="900" value="${clock(original.open)}" required></label><label class="field">Fecha às<input name="close" type="time" step="900" value="${clock(original.close)}" required></label></div><label class="field">Intervalo entre atendimentos<select name="interval">${[0, 15, 30].map(value => `<option value="${value}" ${original.interval === value ? 'selected' : ''}>${value} minutos</option>`).join('')}</select></label><fieldset><legend>Dias de atendimento</legend><div class="days">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, day) => `<label><input type="checkbox" name="days" value="${day}" ${original.days.includes(day) ? 'checked' : ''}>${label}</label>`).join('')}</div></fieldset><div class="list-heading"><h3>Serviços</h3><button type="button" class="secondary" id="add-service">＋ Adicionar serviço</button></div><p class="small">Preço em reais. Mantenha pelo menos um serviço disponível.</p><div id="services-editor"></div><div class="actions"><button type="button" class="secondary" id="back">Voltar à agenda</button><button type="submit" class="primary">Salvar configurações</button></div></form></section>`;
  const form = $('#config-form');
  function renderServices() {
    $('#services-editor').innerHTML = services.map((service, index) => `<fieldset class="service-editor"><legend>Serviço ${index + 1}</legend><div class="config-service"><label class="field">Nome<input data-field="name" data-index="${index}" value="${esc(service.name)}" minlength="2" maxlength="60" required></label><label class="field">Preço (R$)<input data-field="price" data-index="${index}" type="number" min="0" max="10000" step="0.01" value="${service.price / 100}" required></label><label class="field">Minutos<select data-field="duration" data-index="${index}">${[15, 30, 45, 60, 75, 90, 120].map(value => `<option value="${value}" ${value === service.duration ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div><button type="button" class="text-button danger" data-remove="${index}" ${services.length === 1 ? 'disabled' : ''}>Remover serviço ${index + 1}</button></fieldset>`).join('');
    $('#add-service').disabled = services.length >= 20;
    $('#services-editor').querySelectorAll('[data-field]').forEach(input => input.oninput = () => {
      const field = input.dataset.field;
      services[Number(input.dataset.index)][field] = field === 'price' ? Math.round(Number(input.value) * 100) : field === 'duration' ? Number(input.value) : input.value;
    });
    $('#services-editor').querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { services.splice(Number(button.dataset.remove), 1); renderServices(); $('#add-service').focus(); });
  }
  $('#add-service').onclick = () => { services.push({ id: 's-' + crypto.randomUUID().slice(0, 20), name: '', price: 0, duration: 30 }); renderServices(); $('#services-editor').querySelector('fieldset:last-child input').focus(); };
  $('#back').onclick = () => { notice(''); task(renderAdmin); };
  form.onsubmit = event => {
    event.preventDefault();
    const minute = value => { const [hour, minutes] = value.split(':').map(Number); return hour * 60 + minutes; };
    const updated = { name: form.elements.name.value.trim(), open: minute(form.elements.open.value), close: minute(form.elements.close.value), interval: Number(form.elements.interval.value), days: [...form.querySelectorAll('[name=days]:checked')].map(input => Number(input.value)), services: services.map(service => ({ ...service, name: service.name.trim() })) };
    submit(form.querySelector('[type=submit]'), async () => {
      await api('admin/config', { method: 'PUT', body: JSON.stringify(updated) });
      state.config = { ...updated, admin: true }; state.service = null;
      $('#business-name').textContent = updated.name;
      notice('Configurações salvas. Reservas existentes foram preservadas.', true);
    });
  };
  renderServices(); focusTitle();
}

async function init() {
  try {
    state.config = await api('config');
    $('#business-name').textContent = state.config.name;
    $('#admin-nav').hidden = false;
    app.removeAttribute('aria-busy');
    const fragment = new URLSearchParams(location.hash.slice(1)).get('reserva');
    if (fragment) {
      const [id, token] = fragment.split('.');
      saved = mergeReservationKeys(saved, { id, token });
      persist();
      history.replaceState(null, '', location.pathname);
      chooseView('history');
    } else chooseView('book');
  } catch (error) {
    app.removeAttribute('aria-busy');
    app.innerHTML = '<div class="content-panel"><h2 id="section-title">A agenda está indisponível.</h2><p class="sub">Verifique a conexão e tente novamente.</p><button class="primary" id="retry-init">Tentar novamente</button></div>';
    $('#retry-init').onclick = init;
    notice(error.message);
  }
}
init();
