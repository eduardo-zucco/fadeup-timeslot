export function createOperatorSession() {
  let key = '';
  try { key = sessionStorage.getItem('fadeup-admin') || ''; } catch {}
  return {
    get key() { return key; },
    set key(value) { key = value; },
    save() { try { sessionStorage.setItem('fadeup-admin', key); } catch {} },
    clear() { key = ''; try { sessionStorage.removeItem('fadeup-admin'); } catch {} },
  };
}
