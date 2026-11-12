import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canManage, mergeReservationKeys, shiftDate } from '../public/assets/js/shared/format.js';

test('ações da reserva respeitam início em São Paulo e status cancelado', () => {
  const booking = { date: '2026-11-13', start: 540, status: 'confirmed' };
  assert.equal(canManage(booking, +new Date('2026-11-13T11:59:59Z')), true);
  assert.equal(canManage(booking, +new Date('2026-11-13T12:00:00Z')), false);
  assert.equal(canManage({ ...booking, status: 'cancelled' }, +new Date('2026-11-12T12:00:00Z')), false);
});
test('chaves importadas atualizam reserva sem duplicar nem guardar dados pessoais', () => {
  const id = '365b6db2-f803-4870-bf19-9430b9eab9d8';
  const oldToken = 'a'.repeat(72), token = 'b'.repeat(72);
  assert.deepEqual(mergeReservationKeys([{ id, token: oldToken, name: 'Privado' }, null, { id: 'invalid', token }], { id, token }), [{ id, token }]);
  assert.deepEqual(mergeReservationKeys('corrupted', { id, token: '' }), []);
});
test('atalhos e limites de data atravessam mês e ano sem mudar o dia pelo fuso', () => {
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
  assert.equal(shiftDate('2026-11-12', 90), '2027-02-10');
});
