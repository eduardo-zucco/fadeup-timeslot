import { ValidationError } from './errors.mjs';

export function customer(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const errors = {};
  if (name.length < 2 || name.length > 80) errors.name = 'Informe seu nome, entre 2 e 80 caracteres.';
  if (!/^(?:55)?\d{10,11}$/.test(phone)) errors.phone = 'Informe um telefone com DDD, por exemplo (14) 99999-9999.';
  if (body.consent !== true) errors.consent = 'Autorize o uso dos dados para administrar a reserva.';
  if (Object.keys(errors).length) throw new ValidationError('Confira os campos destacados.', errors);
  return { name, phone };
}

