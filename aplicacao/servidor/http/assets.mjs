export function assetResponse(request, asset) {
  if (!asset) return new Response('Não encontrado', { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Método não permitido', { status: 405 });
  return new Response(request.method === 'HEAD' ? null : asset.body, { headers: {
    'Content-Type': asset.type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    'Cache-Control': 'no-cache',
  } });
}
