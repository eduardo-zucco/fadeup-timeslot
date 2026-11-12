import { esc } from './format.js';
export function confirmAction(text, fn) {
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

