/**
 * Cloudflare Worker — entrypoint unifié pour 958.fr.
 *
 * Route dynamique :
 *   POST /api/lead → proxy vers le webhook n8n (évite les blocages
 *   cross-origin des extensions navigateur type Brave Shields).
 *
 * Tout le reste → binding ASSETS (fichiers statiques dans ./dist).
 */

export interface Env {
  ASSETS: Fetcher;
  N8N_WEBHOOK_URL?: string;
  PUBLIC_N8N_WEBHOOK_DIAGNOSTIC?: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      return handleLead(request, env);
    }

    // Tous les autres chemins → static assets (dist/)
    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: 'POST', 'content-type': 'text/plain' },
    });
  }

  const webhook = env.N8N_WEBHOOK_URL || env.PUBLIC_N8N_WEBHOOK_DIAGNOSTIC;
  if (!webhook) {
    return json({ error: 'webhook_not_configured', hint: 'Set N8N_WEBHOOK_URL in Cloudflare env.' }, 500);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Traçabilité côté serveur
  const enriched = {
    ...(typeof payload === 'object' && payload !== null ? payload : {}),
    _proxied_at: new Date().toISOString(),
    _origin: request.headers.get('origin') || 'unknown',
    _cf_ray: request.headers.get('cf-ray') || undefined,
  };

  let upstream: Response;
  try {
    upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(enriched),
    });
  } catch (e) {
    return json({ error: 'upstream_fetch_failed', message: (e as Error).message }, 502);
  }

  const text = await upstream.text();
  return new Response(text || '{"ok":true}', {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
