import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoginView } from '../aplicacao/interface/assets/js/admin/login.js';

function loginHarness(api) {
  const button = {};
  const form = { elements: { key: { value: 'chave-digitada-pelo-operador-123456' } }, querySelector: () => button };
  const calls = { notices: [], saved: 0, rendered: 0, prevented: 0 };
  let pending;
  const context = {
    state: { authenticated: false, config: null }, app: {}, $: () => form, api,
    notice: text => calls.notices.push(text),
    submit: (target, action) => { assert.equal(target, button); pending = action(); },
    session: { key: 'chave-anterior', save: () => calls.saved++ },
    admin: { render: async () => { calls.rendered++; } },
  };
  createLoginView(context)();
  return { context, calls, form, submit() { form.onsubmit({ preventDefault: () => calls.prevented++, target: form }); return pending; } };
}

test('login limpa aviso pelo contexto e abre agenda após autenticar', async () => {
  const routes = [];
  const config = { name: 'Barbearia de teste' };
  const h = loginHarness(async path => { routes.push(path); return path === 'admin/config' ? config : { authenticated: true }; });
  await h.submit();
  assert.deepEqual(h.calls.notices, ['']);
  assert.equal(h.calls.prevented, 1);
  assert.deepEqual(routes, ['admin/session', 'admin/config']);
  assert.equal(h.context.state.authenticated, true);
  assert.equal(h.context.state.config, config);
  assert.equal(h.calls.saved, 1);
  assert.equal(h.calls.rendered, 1);
});

test('login inválido mantém agenda fechada e não salva a chave rejeitada', async () => {
  const h = loginHarness(async () => { const error = new Error('Não autorizado'); error.status = 403; throw error; });
  await assert.rejects(h.submit(), /Chave inválida/);
  assert.equal(h.context.session.key, 'chave-anterior');
  assert.equal(h.context.state.authenticated, false);
  assert.equal(h.calls.saved, 0);
  assert.equal(h.calls.rendered, 0);
});
