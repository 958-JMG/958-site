/**
 * Cloudflare Worker — entrypoint 958.fr (site mono-page Astro, bascule 2026-07-03).
 *
 * Politique : le site est désormais mono-page (/). Toute route qui n'existe plus
 * (anciennes pages v2c : /diagnostic, /methode, /produit, /formation*, /faq,
 * /audit-ia-pme, /consultant-ia-vannes, /realisations, /mentions-legales, /merci…)
 * → 301 vers l'accueil ("301 pour TOUT", demande JMG 2026-07-03).
 *
 * Mécanique : on sert d'abord les assets statiques (dist/). Si l'asset n'existe
 * pas (404), on renvoie une 301 permanente vers "/". La home et les vrais assets
 * (CSS/JS/images/fonts) sont servis normalement en 200.
 */

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Canonicalisation www → apex : www.958.fr/... → 301 → https://958.fr/... (chemin + query conservés).
    // Évite le doublon de contenu pour Google. Pas de boucle : l'apex n'a pas le préfixe "www.".
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    // On ne redirige que les navigations GET/HEAD ; les autres méthodes passent tel quel.
    const res = await env.ASSETS.fetch(request);

    if (res.status === 404 && (request.method === 'GET' || request.method === 'HEAD')) {
      // Route disparue → 301 vers l'accueil.
      return Response.redirect(new URL('/', url.origin).toString(), 301);
    }

    return res;
  },
};
