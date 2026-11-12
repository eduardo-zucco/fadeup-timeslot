import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQLite } from '../aplicacao/servidor/infrastructure/sqlite.mjs';

test('migração de consistência preserva reservas existentes e protege ocupação após reabrir banco', t => {
  const dir = mkdtempSync(join(tmpdir(), 'fadeup-migration-'));
  const file = join(dir, 'agenda.sqlite');
  const before = new DatabaseSync(file);
  before.exec(readFileSync(new URL('../banco/migracoes/0000_fadeup.sql', import.meta.url), 'utf8'));
  before.prepare('INSERT INTO bookings(id,token,name,phone,service,price,duration,date,start,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('existing', 'secret', 'Cliente anterior', '11999990000', 'Corte', 4000, 30, '2026-11-13', 540, 'confirmed', 'appointment', '2026-11-12');
  before.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').run('2026-11-13', 540, 'existing');
  before.exec(readFileSync(new URL('../banco/migracoes/0001_booking_consistency.sql', import.meta.url), 'utf8'));
  before.close();
  const after = new SQLite(file);
  t.after(() => { after.close(); unlinkSync(file); rmdirSync(dir); });
  assert.equal(after.raw.prepare('SELECT name FROM bookings WHERE id=?').get('existing').name, 'Cliente anterior');
  assert.equal(after.raw.prepare('SELECT COUNT(*) AS n FROM occupancy').get().n, 1);
  after.raw.prepare("UPDATE bookings SET status='cancelled' WHERE id=?").run('existing');
  assert.equal(after.raw.prepare('SELECT COUNT(*) AS n FROM occupancy').get().n, 0);
  assert.throws(() => after.raw.prepare('INSERT INTO occupancy(date,minute,booking) VALUES(?,?,?)').run('2026-11-13', 600, 'existing'), /booking_not_confirmed/);
});
