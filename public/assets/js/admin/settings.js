import { settingsPage } from './settings-template.js';
import { esc } from '../shared/format.js';
export function createSettingsView(context) {
  const { state, app, api, notice, task, submit, focusTitle } = context;
  const $ = context.$;
  function renderConfig() {
    const original = state.config;
    const services = original.services.map(service => ({ ...service }));
    app.innerHTML = settingsPage({ original });
    const form = $('#config-form');
    function renderServices() {
      $('#services-editor').innerHTML = services.map((service, index) => `<fieldset class="service-editor"><legend>Serviço ${index + 1}</legend><div class="config-service"><label class="field">Nome<input data-field="name" data-index="${index}" value="${esc(service.name)}" minlength="2" maxlength="60" required></label><label class="field">Preço (R$)<input data-field="price" data-index="${index}" type="number" min="0" max="10000" step="0.01" value="${service.price / 100}" required></label><label class="field">Minutos<select data-field="duration" data-index="${index}">${[15, 30, 45, 60, 75, 90, 120].map(value => `<option value="${value}" ${value === service.duration ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div><button type="button" class="text-button danger" data-remove="${index}" ${services.length === 1 ? 'disabled' : ''}>Remover serviço ${index + 1}</button></fieldset>`).join('');
      $('#add-service').disabled = services.length >= 20;
      $('#services-editor').querySelectorAll('[data-field]').forEach(input => input.oninput = () => {
        const field = input.dataset.field;
        services[Number(input.dataset.index)][field] = field === 'price' ? Math.round(Number(input.value) * 100) : field === 'duration' ? Number(input.value) : input.value;
      });
      $('#services-editor').querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { services.splice(Number(button.dataset.remove), 1); renderServices(); $('#add-service').focus(); });
    }
    $('#add-service').onclick = () => { services.push({ id: 's-' + crypto.randomUUID().slice(0, 20), name: '', price: 0, duration: 30 }); renderServices(); $('#services-editor').querySelector('fieldset:last-child input').focus(); };
    $('#back').onclick = () => { notice(''); task(context.admin.render); };
    form.onsubmit = event => {
      event.preventDefault();
      const minute = value => { const [hour, minutes] = value.split(':').map(Number); return hour * 60 + minutes; };
      const updated = { name: form.elements.name.value.trim(), open: minute(form.elements.open.value), close: minute(form.elements.close.value), interval: Number(form.elements.interval.value), days: [...form.querySelectorAll('[name=days]:checked')].map(input => Number(input.value)), services: services.map(service => ({ ...service, name: service.name.trim() })) };
      submit(form.querySelector('[type=submit]'), async () => {
        await api('admin/config', { method: 'PUT', body: JSON.stringify(updated) });
        state.config = updated; state.service = null;
        $('#business-name').textContent = updated.name;
        notice('Configurações salvas. Reservas existentes foram preservadas.', true);
      });
    };
    renderServices(); focusTitle();
  }


  return renderConfig;

}
