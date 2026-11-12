import { defaults, validConfig } from '../domain/config.mjs';
import { available, cells, dateOK, time, agendaRangeOK } from '../domain/scheduling.mjs';
import { customer } from '../domain/customer.mjs';
import { HttpError, ValidationError } from '../domain/errors.mjs';
import { notifications } from '../domain/notifications.mjs';

const durations = [15, 30, 45, 60, 75, 90, 120];
const conflict = error => /UNIQUE constraint failed|booking_not_confirmed|constraint failed.*occupancy/i.test(error?.message || '');
export function createAgendaService(repository) {
  async function getConfig() { return await repository.getConfig() || structuredClone(defaults); }
  async function slots(date, duration, config, exclude = null) {
    if (!dateOK(date)) throw new ValidationError('Escolha uma data de hoje até os próximos 90 dias.');
    return available(date, duration, config, await repository.occupied(date, exclude));
  }
  async function authorizeBooking(id, token, operator) {
    const booking = await repository.findBooking(id);
    if (!booking || (!operator && token !== booking.token)) throw new HttpError(404, 'Reserva não encontrada ou link inválido.');
    return booking;
  }
  function requireConfirmed(booking) {
    if (booking.status !== 'confirmed') throw new HttpError(409, 'Esta reserva já foi cancelada. Atualize seus horários.');
  }
  return {
    getConfig,
    async updateConfig(config) {
      if (!validConfig(config)) throw new ValidationError('Confira serviços, dias e expediente. Use horários em múltiplos de 15 minutos.');
      const clean = { name: config.name.trim(), open: config.open, close: config.close, interval: config.interval, days: [...new Set(config.days)],
        services: config.services.map(service => ({ id: service.id, name: service.name.trim(), price: service.price, duration: service.duration })) };
      await repository.saveConfig(clean);
    },
    async listSlots(date, serviceId, duration, operator) {
      const config = await getConfig();
      const minutes = operator ? duration : config.services.find(service => service.id === serviceId)?.duration;
      if (!durations.includes(minutes)) throw new ValidationError('Escolha um serviço ou uma duração válida.');
      return slots(date, minutes, config);
    },
    async listAgenda(date, end) {
      if (!agendaRangeOK(date, end)) throw new ValidationError('Escolha um período válido de até 31 dias.');
      return repository.listAgenda(date, end);
    },
    async getBooking(id, token, operator) {
      const { token: secret, ...booking } = await authorizeBooking(id, token, operator);
      return booking;
    },
    async bookingSlots(id, date, token, operator) {
      const booking = await authorizeBooking(id, token, operator);
      requireConfirmed(booking);
      return slots(date, booking.duration, await getConfig(), id);
    },
    async cancelBooking(id, token, operator) {
      const booking = await authorizeBooking(id, token, operator);
      requireConfirmed(booking);
      if (!operator && +new Date(`${booking.date}T${time(booking.start)}:00-03:00`) <= Date.now()) throw new HttpError(409, 'Este atendimento já começou. Fale com a barbearia.');
      await repository.cancelBooking(booking, notifications(booking, ['cancellation'], new Date().toISOString()));
    },
    async moveBooking(id, body, token, operator) {
      const booking = await authorizeBooking(id, token, operator);
      requireConfirmed(booking);
      if (!operator && +new Date(`${booking.date}T${time(booking.start)}:00-03:00`) <= Date.now()) throw new HttpError(409, 'Este atendimento já começou. Fale com a barbearia.');
      const config = await getConfig();
      if (!(await slots(body.date, booking.duration, config, id)).includes(body.start)) throw new HttpError(409, 'Esse horário não está mais disponível. Escolha outro.');
      try { await repository.moveBooking(id, body.date, body.start, cells(body.start, booking.duration, config.interval), notifications({ ...booking, date: body.date, start: body.start }, ['confirmation', 'reminder'], new Date().toISOString())); }
      catch (error) { if (!conflict(error)) throw error; throw new HttpError(409, 'A reserva ou o horário mudou. Atualize os dados e tente novamente.'); }
    },
    async createBooking(body, operator) {
      const config = await getConfig();
      const block = operator && body.kind === 'block';
      const who = block ? { name: String(body.name || '').trim(), phone: '' } : customer(body);
      if (block && (who.name.length < 2 || who.name.length > 80)) throw new ValidationError('Informe o motivo do bloqueio, entre 2 e 80 caracteres.');
      const service = block ? { name: 'Bloqueio', duration: body.duration, price: 0 } : config.services.find(service => service.id === body.service);
      if (!service || !durations.includes(service.duration)) throw new ValidationError('O serviço foi alterado. Atualize a lista e escolha novamente.');
      if (!(await slots(body.date, service.duration, config)).includes(body.start)) throw new HttpError(409, 'Esse horário não está mais disponível. Escolha outro.');
      const booking = { id: crypto.randomUUID(), token: crypto.randomUUID() + crypto.randomUUID(), ...who, service: service.name, price: service.price, duration: service.duration,
        date: body.date, start: body.start, status: 'confirmed', kind: block ? 'block' : 'appointment', created: new Date().toISOString() };
      try { await repository.createBooking(booking, cells(body.start, service.duration, config.interval), notifications(booking, block ? [] : ['confirmation', 'reminder'], booking.created)); }
      catch (error) { if (!conflict(error)) throw error; throw new HttpError(409, 'Esse horário acabou de ser ocupado. Escolha outro.'); }
      const { created, ...result } = booking;
      return result;
    },
  };
}
