import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('pacote compilado executa sem fontes externas e mantém cliente e administração isolados', async t => {
  execFileSync(process.execPath, ['ferramentas/compilar.mjs']);
  const { startServer } = await import('../.local/compilado/aplicacao/servidor/node-server.mjs?test=' + Date.now());
  const directory = await mkdtemp(join(tmpdir(), 'fadeup-build-'));
  const databaseFile = join(directory, 'agenda.sqlite');
  const runtime = await startServer({ HOST: '127.0.0.1', PORT: '0', DB_FILE: databaseFile, ADMIN_KEY: 'chave-compilacao-somente-teste-123456' });
  t.after(async () => { await runtime.close(); await unlink(databaseFile); await rmdir(directory); });
  const root = 'http://127.0.0.1:' + runtime.server.address().port;
  const page = await fetch(root);
  assert.equal(page.status, 200); assert.doesNotMatch(await page.text(), /data-view="admin"|admin-nav/);
  assert.equal((await fetch(root + '/assets/js/shared/format.js')).status, 200);
  assert.equal((await fetch(root + '/api/config')).status, 200);
  assert.equal((await fetch(root + '/admin')).status, 200);
  assert.equal((await fetch(root + '/api/admin/session')).status, 403);
  assert.equal((await fetch(root + '/api/admin/session', { headers: { 'X-Admin-Key': 'chave-compilacao-somente-teste-123456' } })).status, 200);
  assert.equal((await fetch(root + '/api/admin/session', { headers: { 'oai-authenticated-user-email': 'owner@test.invalid' } })).status, 403);
});
