import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('test-results', { recursive: true });
const result = spawnSync(process.execPath, [
  '--test', '--test-reporter=spec', '--test-reporter=junit',
  '--test-reporter-destination=stdout', '--test-reporter-destination=test-results/junit.xml',
  'tests/*.test.mjs',
], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
