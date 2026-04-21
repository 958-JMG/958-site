// Cloudflare Pages Function — proxy vers le webhook n8n.
// But : les forms du site postent en same-origin (/api/lead) au lieu
// du webhook public n8n.cloud. Evite les blocages d'extensions
// (Brave Shields, ad-blockers) qui cassent les cross-origin vers des
// domaines "tracker-like".
//
// Var d'env à définir côté Cloudflare Pages (Settings → Environment variables) :
//   N8N_WEBHOOK_URL = https://jmg958.app.n8n.cloud/webhook/diagnostic-site
// Fallback : PUBLIC_N8N_WEBHOOK_DIAGNOSTIC (existante côté Astro build).

interface Env {
  N8N_WEBHOOK_URL?: string;
  PUBLIC_N8N_WEBHOOK_DIAGNOSTIC?: string;
}

interface Context {
  request: Request;
  env: Env;
}

function jsonResponse(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequest(context: Context): Promise<Response> {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: 'POST', 'content-type': 'text/plain' },
    });
  }
  const webhook = env.N8N_WEBHOOK_URL || env.PUBLIC_N8N_WEBHOOK_DIAGNOSTIC;

  if (!webhook) {
    return jsonResponse(
      { error: 'webhook_not_configured', hint: 'Set N8N_WEBHOOK_URL in Cloudflare Pages env.' },
      500,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  // Annote la source côté serveur pour la traçabilité n8n.
  const enriched = {
    ...(typeof payload === 'object' && payload !== null ? payload : {}),
    _proxied_at: new Date().toISOString(),
    _origin: request.headers.get('origin') || 'unknown',
  };

  let upstream: Response;
  try {
    upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(enriched),
    });
  } catch (e) {
    return jsonResponse(
      { error: 'upstream_fetch_failed', message: (e as Error).message },
      502,
    );
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

