import { esc, today } from './format.js';
import { createApiClient } from './api.js';
import { createReservationStore } from './storage.js';

// Each page owns a context; client and operator never share navigation or credentials.
export function createApplication({ area = 'client', session = null } = {}) {
  const $ = selector => document.querySelector(selector);
  const app = $('#app');
  const state = { config: null, authenticated: false, view: area === 'admin' ? 'admin' : 'book', step: 1, service: null, date: today(), start: null, slots: [], editing: null, manual: false, agendaDate: today(), week: false, draft: { name: '', phone: '', consent: false }, revision: 0, slotRequest: 0 };
  let submitting = false;
  const views = new Map();
  function notice(text, ok = false) {
    $('#notice').innerHTML = text ? `<div class="alert ${ok ? 'ok' : ''}"><span>${esc(text)}</span><button aria-label="Fechar aviso">×</button></div>` : '';
    if (text) $('#notice button').onclick = () => notice('');
  }
  async function task(fn) { try { await fn(); } catch (error) { notice(error.message); } }
  async function submit(button, fn) {
    if (submitting) return;
    submitting = true;
    const controls = [...document.querySelectorAll('nav button, #app button, #app input, #app select')].map(control => [control, control.disabled]);
    controls.forEach(([control]) => { control.disabled = true; });
    button.setAttribute('aria-busy', 'true');
    try { await fn(); } catch (error) {
      if (area === 'admin' && error.status === 403) { session.clear(); state.authenticated = false; navigate('admin'); }
      notice(error.message);
    } finally {
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
      admin: ['ÁREA DA BARBEARIA', 'Sua agenda, em ordem.', 'Acesso exclusivo para o responsável da barbearia.'],
    }[state.view];
    $('#section-label').textContent = content[0]; $('#page-title').textContent = content[1]; $('#page-description').textContent = content[2];
  }
  function navigate(view) {
    const render = views.get(view);
    if (!render) return;
    state.revision++; state.slotRequest++; state.view = view; state.editing = null; state.manual = false;
    notice('');
    document.querySelectorAll('nav button').forEach(button => { button.classList.toggle('active', button.dataset.view === view); button.setAttribute('aria-pressed', String(button.dataset.view === view)); });
    heading();
    if (view === 'book') { state.step = 1; state.start = null; }
    task(render);
  }
  function startError(error, retry) {
    app.removeAttribute('aria-busy');
    app.innerHTML = '<section class="content-panel"><h2 id="section-title">A agenda está indisponível.</h2><p class="sub">Verifique a conexão e tente novamente.</p><button class="primary" id="retry-init">Tentar novamente</button></section>';
    $('#retry-init').onclick = retry; notice(error.message);
  }
  document.querySelectorAll('nav button').forEach(button => button.onclick = () => navigate(button.dataset.view));
  return { $, app, state, api: createApiClient(() => session?.key || ''), session, reservations: createReservationStore(notice), notice, task, submit, focusTitle, heading, navigate, startError,
    register(view, render) { if (area === 'client' && !['book', 'history'].includes(view)) throw new Error('Área inválida.'); views.set(view, render); },
  };
}
