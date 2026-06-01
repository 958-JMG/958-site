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

// Redirections 301 post-cutover (anciens chemins proto v2c + v2 + v2b → racine)
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
  '/preview/v2': '/',
  '/preview/v2/': '/',
  '/preview/v2b': '/',
  '/preview/v2b/': '/',
};

// Origines autorisées pour POST /api/lead (anti open-relay vers n8n)
const ALLOWED_ORIGINS = new Set([
  'https://www.958.fr',
  'https://958.fr',
]);

// Garde-fous payload
const MAX_PAYLOAD_BYTES = 8 * 1024; // 8 KiB
const REQUIRED_FIELDS = ['nom', 'email', 'type'] as const;
const MAX_FIELD_LENGTH = 4000;

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

  // Garde-fou 1 — Origin allowlist (bloque l'open-relay vers n8n)
  const origin = request.headers.get('origin') || '';
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: 'origin_not_allowed' }, 403);
  }

  // Garde-fou 2 — Taille payload max 8 KiB
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return json({ error: 'payload_too_large', max_bytes: MAX_PAYLOAD_BYTES }, 413);
  }

  const webhook = env.N8N_WEBHOOK_URL || env.PUBLIC_N8N_WEBHOOK_DIAGNOSTIC;
  if (!webhook) {
    return json({ error: 'webhook_not_configured', hint: 'Set N8N_WEBHOOK_URL in Cloudflare env.' }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== 'object' || parsed === null) {
      return json({ error: 'invalid_payload_shape' }, 400);
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Garde-fou 3 — Honeypot anti-bot (côté serveur, en plus du front)
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    // On simule un succès pour ne pas signaler au bot qu'il est détecté
    return json({ ok: true, _honeypot: true }, 200);
  }

  // Garde-fou 4 — Champs requis présents et de bonne taille
  for (const field of REQUIRED_FIELDS) {
    const value = payload[field];
    if (typeof value !== 'string' || value.trim() === '') {
      return json({ error: 'missing_required_field', field }, 400);
    }
    if (value.length > MAX_FIELD_LENGTH) {
      return json({ error: 'field_too_long', field, max: MAX_FIELD_LENGTH }, 413);
    }
  }

  // Traçabilité côté serveur
  const enriched = {
    ...payload,
    _proxied_at: new Date().toISOString(),
    _origin: origin || 'unknown',
    _cf_ray: request.headers.get('cf-ray') || undefined,
  };

  // Garde-fou 5 — Timeout fetch upstream (n8n) à 15s
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let upstream: Response;
  try {
    upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(enriched),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const message = (e as Error).message;
    const isTimeout = (e as Error).name === 'AbortError';
    return json({
      error: isTimeout ? 'upstream_timeout' : 'upstream_fetch_failed',
      message,
    }, isTimeout ? 504 : 502);
  }
  clearTimeout(timeout);

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
