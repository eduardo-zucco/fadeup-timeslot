import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localServer } from './helpers/server.mjs';
const key = 'somente-para-teste-do-isolamento-123456789';

test('cliente não tem painel nem código administrativo no grafo de módulos', async t => {
  const root = await localServer(t);
  const page = await (await fetch(root)).text();
  assert.doesNotMatch(page, /data-view="admin"|href="\/admin|admin-nav|Painel/);
  assert.match(page, /\/assets\/js\/client.js/);
  const visited = new Set();
  async function visit(path) {
    if (visited.has(path)) return;
    visited.add(path);
    const response = await fetch(root + path);
    assert.equal(response.status, 200, path);
    const code = await response.text();
    for (const match of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const dependency = new URL(match[1], root + path).pathname;
      assert(!dependency.includes('/admin'), `Cliente importou ${dependency}`);
      await visit(dependency);
    }
  }
  await visit('/assets/js/client.js');
  assert(visited.has('/assets/js/booking/index.js'));
  assert(visited.has('/assets/js/history/index.js'));
});

test('loopback exige autenticação e rejeita identidade administrativa forjada', async t => {
  const root = await localServer(t, { ADMIN_KEY: key, ADMIN_EMAIL: 'owner@example.test' });
  const publicConfig = await (await fetch(root + '/api/config', { headers: { 'X-Admin-Key': key } })).json();
  assert.equal(publicConfig.admin, undefined);
  assert.equal((await fetch(root + '/api/admin/session')).status, 403);
  assert.equal((await fetch(root + '/api/admin/session', { headers: { 'oai-authenticated-user-email': 'owner@example.test' } })).status, 403);
  assert.equal((await fetch(root + '/api/admin/session', { headers: { 'X-Booking-Token': key } })).status, 403);
  for (const [path, method] of [['agenda?date=2026-11-13', 'GET'], ['slots?date=2026-11-13&duration=30', 'GET'], ['config', 'GET'], ['config', 'PUT'], ['bookings', 'POST'], ['bookings/test', 'DELETE'], ['bookings/test', 'PATCH']]) {
    assert.equal((await fetch(root + '/api/admin/' + path, { method })).status, 403, path);
  }
  const authorized = await fetch(root + '/api/admin/session', { headers: { 'X-Admin-Key': key } });
  assert.equal(authorized.status, 200); assert.equal((await authorized.json()).authenticated, true);
  const login = await (await fetch(root + '/admin')).text();
  assert.match(login, /\/assets\/js\/admin.js/);
  assert.doesNotMatch(login, /data-view="history"/);
});

test('sem chave configurada o modo local nunca concede acesso de operador', async t => {
  const root = await localServer(t);
  assert.equal((await fetch(root + '/api/config')).status, 200);
  assert.equal((await fetch(root + '/api/admin/session')).status, 403);
  assert.equal((await fetch(root + '/api/admin/agenda?date=2026-11-13')).status, 403);
});

test('chave de operador só funciona nas rotas administrativas e cliente precisa do token da reserva', async t => {
  const root = await localServer(t, { ADMIN_KEY: key });
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Key': key };
  const config = await (await fetch(root + '/api/config')).json();
  await fetch(root + '/api/admin/config', { method: 'PUT', headers, body: JSON.stringify({ ...config, days: [0,1,2,3,4,5,6] }) });
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const created = await fetch(root + '/api/bookings', { method: 'POST', headers, body: JSON.stringify({ service: 'corte', date, start: 540, name: 'Cliente isolado', phone: '11999990000', consent: true }) });
  assert.equal(created.status, 201); const booking = await created.json();
  assert.equal((await fetch(root + '/api/bookings/' + booking.id, { headers })).status, 404);
  assert.equal((await fetch(root + '/api/admin/bookings/' + booking.id, { headers })).status, 200);
  assert.equal((await fetch(root + '/api/bookings/' + booking.id, { headers: { 'X-Booking-Token': booking.token } })).status, 200);
  assert.equal((await fetch(root + '/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'block', name: 'Invasão', date, start: 600, duration: 30 }) })).status, 400);
});
