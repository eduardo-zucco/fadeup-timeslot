import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SQLite } from './infrastructure/sqlite.mjs';
import { loadAssets } from './infrastructure/static-files.mjs';
import { createApi } from './http/api.mjs';
import { assetResponse } from './http/assets.mjs';

export async function startServer(env = process.env) {
  const databaseFile = env.DB_FILE || '.local/banco/fadeup.sqlite';
  await mkdir(dirname(databaseFile), { recursive: true });
  const db = new SQLite(databaseFile);
  const api = createApi({ DB: db, ADMIN_KEY: env.ADMIN_KEY });
  const assets = await loadAssets(fileURLToPath(new URL('../../aplicacao/interface/', import.meta.url)));
  const host = env.HOST || '127.0.0.1';
  const server = createServer(async (incoming, outgoing) => {
    try {
      const protocol = incoming.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const url = new URL(incoming.url, `${protocol}://${incoming.headers.host || 'localhost'}`);
      let result;
      if (url.pathname.startsWith('/api/')) {
        const chunks = [];
        let size = 0;
        for await (const chunk of incoming) {
          size += chunk.length;
          if (size > 16384) { outgoing.writeHead(413); outgoing.end('Dados muito grandes'); return; }
          chunks.push(chunk);
        }
        const headers = new Headers(incoming.headers);
        // Standalone Node never trusts an identity header supplied by a client or proxy.
        headers.delete('oai-authenticated-user-email');
        const body = ['GET', 'HEAD'].includes(incoming.method) ? undefined : Buffer.concat(chunks);
        result = await api(new Request(url, { method: incoming.method, headers, body }));
      } else {
        result = assetResponse(new Request(url, { method: incoming.method }), assets[url.pathname]);
      }
      outgoing.writeHead(result.status, Object.fromEntries(result.headers));
      outgoing.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) { console.error(error.message); outgoing.writeHead(500); outgoing.end('Erro interno'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(env.PORT || 5173), host, resolve); });
  console.log(`fadeUp: http://${host}:${server.address().port} (SQLite)`);
  return { server, close: () => new Promise((resolve, reject) => server.close(error => { db.close(); error ? reject(error) : resolve(); })) };
}
