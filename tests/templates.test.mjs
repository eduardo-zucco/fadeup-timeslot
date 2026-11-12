import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serviceStep, customerStep } from '../public/assets/js/booking/templates.js';
import { historyPage } from '../public/assets/js/history/templates.js';
import { agendaPage } from '../public/assets/js/admin/templates.js';
import { settingsPage } from '../public/assets/js/admin/settings-template.js';
import { defaults } from '../src/server/domain/config.mjs';

test('templates de cliente e operador escapam nomes e dados sem inserir HTML executável', () => {
  const malicious = '<img src=x onerror=alert(1)>';
  const service = { ...defaults.services[0], name: malicious };
  const config = { ...structuredClone(defaults), name: malicious, services: [service] };
  const state = { config, date: '2026-11-13', service, manual: false };
  const booking = { id: 'test', service: malicious, name: malicious, date: state.date, start: 540, price: 4000, duration: 30, status: 'confirmed', kind: 'appointment' };
  const pages = [
    serviceStep({ state, service }),
    customerStep({ state, service, draft: { name: malicious, phone: '11999990000', consent: true } }),
    historyPage({ state, group: 'upcoming', groups: { upcoming: [booking], past: [], cancelled: [] }, failures: 0 }),
    agendaPage({ state: { ...state, agendaDate: state.date }, end: state.date, appointments: [booking], blocks: [], records: [booking], dates: [state.date], filter: 'active', signedIn: true }),
    settingsPage({ original: config }),
  ];
  for (const html of pages) { assert.doesNotMatch(html, /<img/); assert.match(html, /&lt;img/); }
});
