import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('.local/relatorios', { recursive: true });
const result = spawnSync(process.execPath, [
  '--test', '--test-reporter=spec', '--test-reporter=junit',
  '--test-reporter-destination=stdout', '--test-reporter-destination=.local/relatorios/junit.xml',
  'testes/*.test.mjs',
], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
