export function createApiClient(getAdminKey = () => '') {
  return async function api(path, options = {}) {
    const key = path.startsWith('admin/') ? getAdminKey() : '';
    let response;
    try { response = await fetch('/api/' + path, { ...options, headers: { 'Content-Type': 'application/json', ...(key ? { 'X-Admin-Key': key } : {}), ...options.headers } }); }
    catch { throw new Error('Sem conexão com a agenda. Verifique sua conexão e tente novamente.'); }
    let data;
    try { data = await response.json(); } catch { throw new Error('A agenda não respondeu como esperado. Tente novamente.'); }
    if (!response.ok) {
      const error = new Error(data.error || 'Não foi possível concluir.');
      error.status = response.status;
      error.fields = data.fields;
      throw error;
    }
    return data;
  };
}
