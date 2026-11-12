import { startServer } from '../src/server/node-server.mjs';
const runtime = await startServer();
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => { await runtime.close(); process.exit(0); });
