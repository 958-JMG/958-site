# 958.fr — Site marketing

Site statique de [**Neuf Cinquante Huit**](https://958.fr). Astro + Tailwind v4. Hébergé sur Cloudflare Workers. Formulaires branchés sur n8n cloud (région EU) via worker proxy.

## Stack

- **Framework** — [Astro 6](https://astro.build) (output statique)
- **Styles** — Tailwind CSS v4 + design tokens v2c (`src/styles/v2b.css`)
- **Polices** — Fraunces Variable (display serif), Inter Variable (sans), JetBrains Mono Variable
- **Analytics** — [Plausible](https://plausible.io) (EU, sans cookie) + Google Analytics 4 (Consent Mode v2 advanced strict)
- **Formulaires** — Worker Cloudflare → proxy n8n cloud (région EU) → Brevo (FR)
- **Hébergement** — Cloudflare Workers + Workers Assets (edge EU, adhésion DPF)

---

## Développement local

Pré-requis : Node ≥ 22.12, [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env   # puis remplir N8N_WEBHOOK_URL
pnpm dev               # http://localhost:4321
pnpm build             # build dans dist/
pnpm preview           # aperçu du build
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `N8N_WEBHOOK_URL` | URL du webhook n8n côté serveur (passe par le worker `/api/lead`). Configurée dans Cloudflare Workers Settings → Variables. |
| `PUBLIC_N8N_WEBHOOK_DIAGNOSTIC` | Legacy — fallback uniquement, l'appel passe désormais par le worker. |

## Structure

```
src/
├── components/v2/   # V2cHeader, V2cFooter, LogoMark, Icon,
│                    # Manifeste958, PortesEntree, OutilsCombines
├── layouts/
│   └── V2bLayout.astro  # SEO essentials (canonical, OG, Twitter, JSON-LD)
│                        # + Fraunces + Inter + JetBrains
├── pages/           # /, /produit/, /methode/, /formation/,
│                    # /formation/decouverte/, /formation/brief/,
│                    # /diagnostic/, /merci/, /mentions-legales/,
│                    # /faq/, /realisations/, /audit-ia-pme/,
│                    # /consultant-ia-vannes/, /formation-ia-bretagne/,
│                    # /404
├── styles/
│   └── v2b.css      # Design tokens v2c (dark cuivre Fraunces)
└── worker.ts        # Cloudflare Worker : redirects 301 + proxy /api/lead
public/              # logos, favicons, og-958.png, robots.txt
deploy/              # workflow n8n + générateur OG
scripts/             # make-logo-transparent.mjs, make-og-image.mjs
```

## Design tokens v2c (résumé)

- Grille **8 pt** (`--s-0` à `--s-11`, 0→192 px)
- Échelle typo `--step--2` à `--step-7`
- Containers : `is-narrow` 640 · `is-default` 920 · `is-wide` 1200
- Palette dark : `--bg #0B0B0A`, `--ivoire #F4ECDC`, `--cuivre #C75F2D`
- Couleurs catégorielles formation : `--cat-decouverte`, `--cat-accompagnement`, `--cat-strategique`, `--cat-metier`, `--cat-reglemente`, `--cat-sur-mesure`

## Worker (`src/worker.ts`)

Le worker fait 3 choses :

1. **Redirections 301** des anciens chemins proto `/preview/v2c/*`, `/preview/v2`, `/preview/v2b` vers les nouveaux.
2. **Proxy `/api/lead`** : reçoit les `POST` des 3 formulaires (`/diagnostic/`, `/formation/brief/`, `/formation/decouverte/`), valide et relaie vers le webhook n8n. Garde-fous : Origin allowlist, taille payload max 8 KiB, honeypot anti-bot côté serveur, champs requis présents, timeout fetch 15 s.
3. **Sert les assets statiques** depuis `dist/` via le binding `ASSETS`.

## Déploiement

Push sur `main` → workflow GitHub Actions `Deploy to Cloudflare Workers` → wrangler deploy → ~30 s.

Voir [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) pour la pipeline et [`deploy/n8n-diagnostic-form.json`](deploy/n8n-diagnostic-form.json) pour le workflow du formulaire côté n8n.

## Licence

© Neuf Cinquante Huit — Tous droits réservés. Ça fait Tilt® est une marque déposée auprès de l'INPI.
