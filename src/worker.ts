/**
 * Cloudflare Worker — entrypoint unifié pour 958.fr.
 *
 * Routes dynamiques :
 *   - 301 /preview/v2c/* → / (rétrocompat liens externes après cutover)
 *   - POST /api/lead → proxy vers le webhook n8n
 *
 * Tout le reste → binding ASSETS (fichiers statiques dans ./dist).
 */

export interface Env {
  ASSETS: Fetcher;
  N8N_WEBHOOK_URL?: string;
  PUBLIC_N8N_WEBHOOK_DIAGNOSTIC?: string;
}

// Redirections 301 post-cutover (anciens chemins proto v2c → racine)
const REDIRECTS_301: Record<string, string> = {
  '/preview/v2c': '/',
  '/preview/v2c/': '/',
  '/preview/v2c/formation': '/formation/',
  '/preview/v2c/formation/': '/formation/',
  '/preview/v2c/formation/decouverte': '/formation/decouverte/',
  '/preview/v2c/formation/decouverte/': '/formation/decouverte/',
  '/preview/v2c/formation/brief': '/formation/brief/',
  '/preview/v2c/formation/brief/': '/formation/brief/',
  '/preview/v2c/diagnostic': '/diagnostic/',
  '/preview/v2c/diagnostic/': '/diagnostic/',
  '/preview/v2c/merci': '/merci/',
  '/preview/v2c/merci/': '/merci/',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Redirections 301 (avant tout traitement)
    const redirectTo = REDIRECTS_301[url.pathname];
    if (redirectTo) {
      return Response.redirect(new URL(redirectTo, url.origin).toString(), 301);
    }

    // 2. Proxy form n8n
    if (url.pathname === '/api/lead') {
      return handleLead(request, env);
    }

    // 3. Tous les autres chemins → static assets (dist/)
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
