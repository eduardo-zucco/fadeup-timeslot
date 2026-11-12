import { startServer } from '../../aplicacao/servidor/node-server.mjs';
import { mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export async function localServer(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'fadeup-access-'));
  const databaseFile = join(directory, 'test.sqlite');
  const runtime = await startServer({ HOST: '127.0.0.1', PORT: '0', DB_FILE: databaseFile, ...options });
  t.after(async () => { await runtime.close(); await unlink(databaseFile); await rmdir(directory); });
  return 'http://127.0.0.1:' + runtime.server.address().port;
}
