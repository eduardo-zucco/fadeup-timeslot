export function isOperator(request, env) {
  const supplied = request.headers.get('X-Admin-Key') || '';
  const expected = env.ADMIN_KEY || '';
  let mismatch = supplied.length ^ expected.length;
  for (let index = 0; index < expected.length; index++) mismatch |= (supplied.charCodeAt(index) || 0) ^ expected.charCodeAt(index);
  return expected.length >= 24 && mismatch === 0;
}
