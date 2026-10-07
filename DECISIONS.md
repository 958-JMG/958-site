# DECISIONS | site 958.fr

- 2026-07-03 | Charte Glaz validée (lin #F1EFEA, ardoise #232A2E, glaz #2F6B66, ajonc #E9B44C ; Bricolage Grotesque / Instrument Sans / IBM Plex Mono).
- 2026-07-03 | Maquette de référence : 958-glaz-v9.html (deck 3 cards scroll-driven, manifeste épinglé, barre 100/20, CTA sticky contextuel). Mobile vérifié (390x844).
- 2026-07-03 | Typo : tirets cadratins remplacés par |. Point médian 9·58 conservé.
- 2026-07-03 | Tunnel CTA validé : Cal.com "Premier échange | 15 min" + 3 questions de qualification + confirmation manuelle + webhook n8n. Event créé via API v2 (id 6199179) : https://cal.com/9.58-neuf-cinquante-huit-iwktuu/premier-echange | 4 CTA branchés (target _blank).
- 2026-07-03 | v1 Astro SANS Tailwind : le CSS testé de la maquette est repris tel quel (global.css). Conversion Tailwind possible ensuite si souhaitée.
- Images auto-hébergées /public/images (WebP), zéro CDN tiers. Déploiement cible : Scaleway derrière Cloudflare.

## Bascule PRODUCTION 958.fr — 2026-07-03

- **Hébergement RÉEL constaté (≠ plan)** : 958.fr n'était PAS sur Scaleway mais sur **Cloudflare Workers**
  (repo `958-JMG/958-site`, worker `958-site` + assets, deploy GitHub Actions `wrangler deploy`).
  Décision JMG : bascule effectuée **en restant sur Cloudflare Workers** (DNS intouché, risque mini).
- **Sauvegarde complète AVANT bascule** : `~/backups/958-prod-20260703/` — bundle git complet
  (`958-site-repo-ALL-3e3eb1b.bundle`, restaurabilité vérifiée par clone-test), archive de l'arbre,
  configs, mirror des 40 fichiers live, SHA256SUMS, MANIFEST. **État sauvegardé = `main` @ `3e3eb1b`.**
- **Redirections** : demande JMG « 301 pour TOUT ». Worker (`src/worker.ts`) : toute route inexistante
  → **301 → /** (anciennes pages v2c /diagnostic /methode /produit /formation* /faq /audit-ia-pme
  /consultant-ia-vannes /realisations /mentions-legales /merci…). Prouvé en local (miniflare) avant deploy.
- **Endpoint abandonné** : `/api/lead` (proxy formulaire → n8n) retiré, tunnel = Cal.com direct.
- **Pipeline** : deploy.yml basculé pnpm → npm (le nouveau site ship un package-lock.json).
- **À traiter en paquet suivant (SIGNALÉ)** : liens footer placeholder `#` (Mentions légales — obligation
  LCEN —, LinkedIn, Ça fait Tilt®). Mentions légales à recréer dans le nouveau site.
<!-- BASCULE_TIME_PLACEHOLDER -->

## Charte 9·58 2026-2027, V2 accent — 2026-10-07

- **JMG** : « go le site et la page de connexion » ; sur les planches (avant, V1 sobre, V2 accent ; le site au bureau et au
  téléphone, en descendant la page) : « V2 go pour les deux ». La charte Glaz du 03/07 (lin, ardoise, glaz, ajonc ;
  Bricolage, Instrument Sans) cède la place à la charte 2026-2027, celle du cockpit, des documents, de la signature et des
  slides : la page grise #EDEDED, le blanc, le noir #111111, l'orange #FF4F00 (le texte posé dessus en NOIR, 5,7:1) et son
  encre #B83600 pour un petit texte orange ; tout carré, sans ombre (un filet) ; Inter, IBM Plex Mono pour les étiquettes.
- **V2** : la barre orange de la signature sur le bord gauche de la page (fixe, de haut en bas).
- Les trois cockpits du deck : noir (le bâtiment), orange (la menuiserie), blanc (le foncier). Les photos restent ; aucun
  texte ne change. Au téléphone, le bouton « Voir ce que ça donne chez vous » tient sur une ligne (Inter est plus large).
- Les jetons gardent leurs noms (glaz, ajonc… valent l'orange) : les composants n'ont pas bougé, seule la feuille change.

