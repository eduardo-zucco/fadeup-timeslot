export const defaults = {
  name: 'fadeUp Barbearia', open: 540, close: 1080, interval: 0,
  days: [1, 2, 3, 4, 5, 6],
  services: [
    { id: 'corte', name: 'Corte', price: 4000, duration: 30 },
    { id: 'barba', name: 'Barba', price: 3000, duration: 30 },
    { id: 'combo', name: 'Corte + barba', price: 6500, duration: 60 },
  ],
};

export function validConfig(config) {
  return !!config && typeof config.name === 'string' && config.name.trim().length > 1 && config.name.length <= 80 &&
    Number.isInteger(config.open) && Number.isInteger(config.close) && config.open >= 0 && config.close <= 1440 &&
    config.open % 15 === 0 && config.close % 15 === 0 && config.close > config.open && [0, 15, 30].includes(config.interval) &&
    Array.isArray(config.days) && config.days.length > 0 && config.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) &&
    Array.isArray(config.services) && config.services.length > 0 && config.services.length <= 20 &&
    config.services.every(service =>
      !!service && typeof service.id === 'string' && /^[a-z0-9-]{1,30}$/.test(service.id) && typeof service.name === 'string' &&
      service.name.trim().length > 1 && service.name.length <= 80 && Number.isInteger(service.price) && service.price >= 0 &&
      service.price <= 1000000 && [15, 30, 45, 60, 75, 90, 120].includes(service.duration)) &&
    new Set(config.services.map(service => service.id)).size === config.services.length;
}
