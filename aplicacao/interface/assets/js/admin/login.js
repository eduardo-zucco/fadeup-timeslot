export function createLoginView(context) {
  const { state, app, api, notice, submit } = context;
  const $ = context.$;
  function renderLogin() {
    app.innerHTML = '<section class="content-panel login-panel"><h2 id="section-title">Acesso da barbearia</h2><p class="sub">Use a chave administrativa do negócio para acessar a agenda e as configurações.</p><form id="login"><label class="field">Chave administrativa<input name="key" type="password" minlength="24" autocomplete="off" required></label><div class="actions"><button class="primary" type="submit">Entrar no painel</button></div></form></section>';
    $('#login').onsubmit = event => {
      event.preventDefault();
      notice('');
      const form = event.target;
      submit(form.querySelector('[type=submit]'), async () => {
        const previousKey = context.session.key;
        context.session.key = form.elements.key.value;
        try {
          await api('admin/session');
          const config = await api('admin/config');
          context.session.save();
          state.authenticated = true;
          state.config = config;
          await context.admin.render();
        } catch (error) {
          context.session.key = previousKey;
          if (error.status === 403) error.message = 'Chave inválida. Confira e tente novamente.';
          throw error;
        }
      });
    };
  }

  return renderLogin;

}
