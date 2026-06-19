# DECISIONS.md — Refonte 958.fr (V3 « éditorial clair »)

> Journal des décisions techniques de la refonte, au fil de l'eau.
> Source de la demande : prompt maître JMG « Build 958.fr ».

## 2026-06-19 — Étape 0 + Étape 1 (système visuel + accueil)

### D1 · Stack — confirmé, pas de migration
La base existante `958-site` est **déjà Astro 6 + Tailwind 4**, fonts **locales**
(`@fontsource-variable` Fraunces / Inter / JetBrains Mono, **aucun Google CDN**),
hébergement **Cloudflare Workers** (`wrangler.jsonc` + `.github/workflows/deploy.yml`).
→ On construit DESSUS, rien à migrer. Le prompt disait « Scaleway/Cloudflare » : la
réalité du repo = **Cloudflare**. Validé par JMG.

### D2 · DA V3 = clair / papier (≠ dark v2b)
Le design system existant `v2b.css` est un **canvas SOMBRE**. Le prompt maître impose
l'inverse : Ivoire `#F4ECDC` = fond/papier, Encre `#16130F` = texte, cuivre **rare**,
« se lit comme une belle page imprimée ». Le prompt fait autorité.
→ Nouveau design system **`src/styles/v3.css`** (clair), indépendant de v2b.
Charte stricte respectée : seules les 5 couleurs + 3 polices listées.
Variantes « -ink » des accents (cuivre/sauge/vert) ajoutées **uniquement** pour
garantir le contraste AA du texte sur ivoire (accessibilité exigée par le prompt).

### D3 · Proto isolé `/v3/` (validé JMG)
Refonte construite en **proto isolé** sous `/v3/`, **non indexée** :
- `V3Layout` : `noindex` **ON par défaut**.
- `astro.config.mjs` : `/v3/` exclu du `sitemap.xml`.
La prod actuelle (`/`, pages v2c) n'est **pas touchée**. Bascule en prod = chantier
séparé, sur go explicite, page par page.

### D4 · Nouveaux slugs portes + 301 (validé JMG)
Architecture cible (hub & spoke) :
- `/` (hub) · `/audit-ia` · `/automatiser-administratif` ·
  `/formation-ia-dirigeants-vannes` · `/ia-souveraine-donnees`
→ À la bascule prod : **redirects 301** depuis les anciens slugs
(`/audit-ia-pme`, `/formation-ia-bretagne`, `/consultant-ia-vannes`…) via
`public/_redirects`. **À faire au moment de la bascule** (pas pendant le proto).

### D5 · Pages hors-portes écartées (validé JMG)
`realisations`, `diagnostic` (form n8n), `faq`, `methode`, `produit`, `consultant-ia-vannes`
ne sont **pas** reprises dans le V3 pour l'instant. Laissées intactes en prod.

### D6 · Finition « premium » (parti pris Tether réimplémenté from scratch)
Aucun code/asset Tether repris (thème sous licence). Réimplémentation maison des
partis pris : hero spacieux grande typo, **cartes cockpit flottantes** (ombres douces,
léger float), sections en bandes alternées, **coins arrondis généreux** (`--r-lg 24px`,
`--r-xl 32px`), beaucoup d'air, grain papier subtil.

### D7 · Micro-animations scroll — zéro dépendance
`reveal` via **IntersectionObserver maison** dans `V3Layout` (pas de lib externe).
Respect `prefers-reduced-motion` (reveal + float désactivés).

### D8 · Cartes cockpit = placeholders crédibles
`CockpitCards.astro` : données **fictives** dans la charte (trésorerie, relances,
tâches), **en attente des captures réelles** fournies par JMG. Aucune donnée client.

## Fichiers créés (V3, Étape 1)
- `src/styles/v3.css` — design system clair
- `src/layouts/V3Layout.astro` — layout + SEO/GEO + reveal
- `src/components/v3/Header.astro`
- `src/components/v3/Footer.astro`
- `src/components/v3/CockpitCards.astro`
- `src/pages/v3/index.astro` — page d'accueil (texte exact du prompt)

## Reste à faire (prochaines étapes, sur go)
- Étape 2 : validation visuelle accueil (desktop + mobile 390px) par JMG.
- Étape 3 : les 4 portes (FAQPage + Course JSON-LD, format « réponse directe »),
  blog « Ça fait Tilt® », `_redirects` 301, `robots.txt` crawlers IA, Lighthouse > 90.
