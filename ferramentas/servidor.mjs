import { startServer } from '../aplicacao/servidor/node-server.mjs';
const runtime = await startServer();
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => { await runtime.close(); process.exit(0); });
