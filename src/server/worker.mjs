import { createApi } from './http/api.mjs';
import { assetResponse } from './http/assets.mjs';
export function createWorker(assets) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (!['GET', 'HEAD'].includes(request.method)) {
        const body = await request.arrayBuffer();
        if (body.byteLength > 16384) return new Response('Dados muito grandes', { status: 413 });
        request = new Request(request, { body });
      }
      return createApi(env)(request);
    }
    return assetResponse(request, assets[url.pathname]);
  } };
}
