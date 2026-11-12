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
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try { await fn(); } catch (error) { notice(error.message); }
  finally { submitting = false; if (button.isConnected) { button.disabled = false; button.removeAttribute('aria-busy'); } }
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
  return `<aside class="summary-panel" aria-label="Resumo do agendamento"><p class="summary-label">Sua reserva</p>${service ? `<h3 class="summary-service">${esc(service.name)}</h3><span class="summary-duration">${service.duration} minutos de atendimento</span><div class="summary-date">${state.step >= 2 ? esc(dateLabel(state.date)) : 'Escolha a data na próxima etapa'}<br><strong>${state.start !== null ? clock(state.start) : 'Horário a definir'}</strong></div><div class="summary-total"><span>Total do serviço</span><strong>${money(service.price)}</strong></div>` : '<p class="summary-placeholder">Escolha um serviço para começar.<br>O seu resumo aparece aqui.</p>'}<p class="summary-note"><strong>Pagamento no estabelecimento.</strong><br>Guarde o link da confirmação para gerenciar sua reserva.</p></aside>`;
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
    shell(`<h2 id="section-title">Só faltam seus dados.</h2><p class="sub">Confira seu resumo antes de confirmar a reserva.</p><form id="customer"><label class="field">Seu nome<input name="name" autocomplete="name" minlength="2" maxlength="80" required value="${esc(draft.name)}" placeholder="Como podemos chamar você?"><span class="field-error" id="error-name"></span></label><label class="field">WhatsApp com DDD<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required maxlength="22" pattern="[+()0-9 .\-]{10,22}" value="${esc(draft.phone)}" placeholder="(14) 99999-9999"><span class="field-error" id="error-phone"></span></label><label class="check"><input name="consent" type="checkbox" required ${draft.consent ? 'checked' : ''}><span>Autorizo o uso do nome e telefone para administrar este agendamento. Os dados ficam disponíveis ao responsável da barbearia.</span></label><span class="field-error" id="error-consent"></span><p class="small">A confirmação aparece aqui. O envio automático pelo WhatsApp ainda não está disponível.</p><div class="actions"><button type="button" class="text-button" id="back">← Alterar horário</button><button type="submit" class="primary">Confirmar ${money(service.price)} →</button></div></form>`);
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
async function renderHistory(){
 app.innerHTML='<h2 id="section-title">Seus agendamentos</h2><p class="sub">Consultando suas reservas…</p>';
 const rows=await Promise.all(saved.map(async s=>{try{return {...await api('bookings/'+s.id,{headers:{'X-Booking-Token':s.token}}),token:s.token};}catch{return null;}}));
 app.innerHTML=`<h2 id="section-title">Seus agendamentos</h2><p class="sub">Reservas salvas neste navegador. Em outro aparelho, abra o link de gerenciamento recebido na confirmação.</p>`+(rows.filter(Boolean).length?rows.filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)||b.start-a.start).map(b=>`<article class="booking-row"><div><span class="status">${b.status==='confirmed'?'Confirmado':'Cancelado'}</span><h3>${esc(b.service)}</h3><p>${dateLabel(b.date)} · ${clock(b.start)} · ${esc(b.name)}</p></div><div class="row-actions">${b.status==='confirmed'?`<button class="secondary" data-edit="${b.id}">Reagendar</button><button class="secondary danger" data-cancel="${b.id}">Cancelar</button>`:''}</div></article>`).join(''):'<p class="empty">Você ainda não tem reservas salvas. Seu próximo horário começa por aqui.</p>');
 app.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>confirmAction('Cancelar este atendimento?',async()=>{const r=rows.find(x=>x?.id===b.dataset.cancel);await api('bookings/'+r.id,{method:'DELETE',headers:{'X-Booking-Token':r.token}});await renderHistory();notice('Reserva cancelada. O horário foi liberado.',true);}));
 app.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const r=rows.find(x=>x?.id===b.dataset.edit);state.editing=r;state.service=state.config.services.find(s=>s.name===r.service&&s.duration===r.duration);if(!state.service){notice('Esse serviço foi alterado. Fale com a barbearia para reagendar.');return;}state.step=2;state.date=today();state.start=null;renderBook();});
}
function confirmAction(text,fn){const dialog=document.createElement('dialog');dialog.innerHTML=`<h2>${esc(text)}</h2><p class="sub">Esta ação libera o horário para outra pessoa.</p><div class="actions"><button class="secondary" id="keep">Manter reserva</button><button class="primary" id="confirm">Confirmar cancelamento</button></div>`;document.body.append(dialog);dialog.showModal();dialog.querySelector('#keep').onclick=()=>{dialog.close();dialog.remove();};dialog.querySelector('#confirm').onclick=async()=>{dialog.close();dialog.remove();await task(fn);};}
function renderLogin(){
 app.innerHTML='<h2 id="section-title">Acesso da barbearia</h2><p class="sub">Informe a chave administrativa configurada no servidor.</p><form id="login"><label class="field">Chave administrativa<input name="key" type="password" minlength="24" autocomplete="off" required></label><div class="actions"><button class="primary" type="submit">Entrar no painel</button></div></form>';
 $('#login').onsubmit=e=>{e.preventDefault();task(async()=>{adminKey=new FormData(e.target).get('key');const c=await api('config');if(!c.admin){adminKey='';throw new Error('Chave inválida.');}try{sessionStorage.setItem('fadeup-admin',adminKey);}catch{}state.config=c;await renderAdmin();});};
}
async function renderAdmin(){
 if(!state.config.admin){renderLogin();return;}

 const end=state.week?new Date(+new Date(state.agendaDate+'T12:00:00-03:00')+6*86400000).toISOString().slice(0,10):state.agendaDate;
 const data=await api(`admin/agenda?date=${state.agendaDate}&end=${end}`),active=data.records.filter(b=>b.status==='confirmed'&&b.kind==='appointment');
 app.innerHTML=`<h2 id="section-title">Sua agenda, em ordem.</h2><p class="sub">Consulte atendimentos e bloqueios de um dia ou de uma semana.</p><div class="tabs"><button id="agenda">Agenda</button><button id="config">Configurações</button></div><div class="toolbar"><label class="field">Data inicial<input id="agenda-date" type="date" value="${state.agendaDate}"></label><label class="field">Visualização<select id="period"><option value="day">Dia</option><option value="week" ${state.week?'selected':''}>Semana</option></select></label><button class="secondary" id="manual">Novo encaixe</button><button class="secondary" id="block">Bloquear horário</button></div><p class="stat"><strong>${active.length}</strong> atendimento(s) confirmado(s) · valor previsto ${money(active.reduce((n,b)=>n+b.price,0))}</p>`+(data.records.length?data.records.map(b=>`<article class="booking-row"><div><span class="status">${b.status==='confirmed'?(b.kind==='block'?'Bloqueio':'Confirmado'):'Cancelado'}</span><h3>${clock(b.start)} · ${esc(b.name)}</h3><p>${dateLabel(b.date)} · ${esc(b.service)} · ${b.duration} min ${b.phone?'· '+esc(b.phone):''}</p></div>${b.status==='confirmed'?`<button class="secondary danger" data-admin-cancel="${b.id}">Cancelar</button>`:''}</article>`).join(''):'<p class="empty">Agenda livre neste período.</p>')+`<p class="small">O valor previsto não representa pagamentos recebidos. Envio por WhatsApp fora deste MVP.</p>`;
 $('#config').onclick=renderConfig;$('#agenda').onclick=()=>task(renderAdmin);$('#agenda-date').onchange=()=>{state.agendaDate=$('#agenda-date').value;task(renderAdmin);};$('#period').onchange=()=>{state.week=$('#period').value==='week';task(renderAdmin);};$('#manual').onclick=()=>{state.manual=true;state.editing=null;state.step=1;renderBook();};$('#block').onclick=blockForm;app.querySelectorAll('[data-admin-cancel]').forEach(b=>b.onclick=()=>confirmAction('Cancelar este item da agenda?',async()=>{await api('admin/bookings/'+b.dataset.adminCancel,{method:'DELETE'});await renderAdmin();notice('Item cancelado.',true);}));
}
function blockForm(){app.innerHTML=`<h2 id="section-title">Reservar um intervalo para você.</h2><form id="block-form"><label class="field">Motivo<input name="name" maxlength="80" required placeholder="Ex.: pausa para almoço"></label><div class="form-grid"><label class="field">Data<input type="date" name="date" min="${today()}" value="${state.agendaDate}" required></label><label class="field">Início<input type="time" step="900" name="time" required></label></div><label class="field">Duração<select name="duration">${[15,30,45,60,90,120].map(n=>`<option value="${n}">${n} minutos</option>`).join('')}</select></label><div class="actions"><button type="button" class="secondary" id="back">Voltar</button><button class="primary" type="submit">Criar bloqueio</button></div></form>`;$('#back').onclick=()=>task(renderAdmin);$('#block-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),[h,m]=f.get('time').split(':').map(Number);task(async()=>{await api('admin/bookings',{method:'POST',body:JSON.stringify({kind:'block',name:f.get('name'),date:f.get('date'),start:h*60+m,duration:Number(f.get('duration'))})});await renderAdmin();notice('Intervalo bloqueado.',true);});};}
function renderConfig(){const c=state.config;app.innerHTML=`<h2 id="section-title">Configurações da barbearia</h2><p class="sub">Alterações valem para novas reservas. Atendimentos existentes mantêm seus dados.</p><form id="config-form"><label class="field">Nome do negócio<input name="name" value="${esc(c.name)}" maxlength="80" required></label><div class="form-grid"><label class="field">Abre às<input name="open" type="time" step="900" value="${clock(c.open)}" required></label><label class="field">Fecha às<input name="close" type="time" step="900" value="${clock(c.close)}" required></label></div><label class="field">Intervalo entre atendimentos<select name="interval">${[0,15,30].map(n=>`<option value="${n}" ${c.interval===n?'selected':''}>${n} minutos</option>`).join('')}</select></label><p class="small">Dias de atendimento</p><div class="days">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,i)=>`<label><input type="checkbox" name="days" value="${i}" ${c.days.includes(i)?'checked':''}> ${d}</label>`).join('')}</div><h3>Serviços</h3><p class="small">Nome · preço em reais · duração em minutos</p>${c.services.map((s,i)=>`<div class="config-service"><label class="field"><span class="small">Nome</span><input name="service-${i}" value="${esc(s.name)}" required></label><label class="field"><span class="small">Preço</span><input type="number" min="0" step="0.01" name="price-${i}" value="${s.price/100}" required></label><label class="field"><span class="small">Minutos</span><select name="duration-${i}">${[15,30,45,60,75,90,120].map(n=>`<option value="${n}" ${n===s.duration?'selected':''}>${n}</option>`).join('')}</select></label></div>`).join('')}<div class="actions"><button type="button" class="secondary" id="back">Voltar à agenda</button><button type="submit" class="primary">Salvar configurações</button></div></form>`;$('#back').onclick=()=>task(renderAdmin);$('#config-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),minute=n=>{const [h,m]=f.get(n).split(':').map(Number);return h*60+m;};task(async()=>{const updated={name:f.get('name'),open:minute('open'),close:minute('close'),interval:Number(f.get('interval')),days:f.getAll('days').map(Number),services:c.services.map((s,i)=>({...s,name:f.get('service-'+i),price:Math.round(Number(f.get('price-'+i))*100),duration:Number(f.get('duration-'+i))}))};await api('admin/config',{method:'PUT',body:JSON.stringify(updated)});state.config={...updated,admin:true};$('#business-name').textContent=updated.name;notice('Configurações salvas.',true);});};}
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
