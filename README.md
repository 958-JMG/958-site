# 958.fr — Site marketing

Site statique de [**Neuf Cinquante Huit**](https://958.fr). Astro + Tailwind v4. Hébergé sur Infomaniak. Formulaire branché sur n8n.

## Stack

- **Framework** — [Astro 6](https://astro.build) (output statique)
- **Styles** — Tailwind CSS v4 + design tokens custom (`src/styles/global.css`)
- **Polices** — Fraunces Variable (display), Geist Variable (sans), Geist Mono
- **Analytics** — [Plausible](https://plausible.io) (EU, sans cookie)
- **Formulaire** — n8n (webhook → validation → email)

---

## Développement local

Pré-requis : Node ≥ 22.12, [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env   # puis remplir PUBLIC_N8N_WEBHOOK_DIAGNOSTIC
pnpm dev               # http://localhost:4321
pnpm build             # build dans dist/
pnpm preview           # aperçu du build
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `PUBLIC_N8N_WEBHOOK_DIAGNOSTIC` | URL publique du webhook n8n qui reçoit les demandes de diagnostic. Le préfixe `PUBLIC_` la rend accessible côté navigateur. |

## Structure

```
src/
├── components/     # Header, Footer, CTAButton, NoiseOverlay, TiltSignature
├── layouts/        # Base.astro (SEO, a11y, reveal observer)
├── pages/          # index, methode, realisations, diagnostic, faq,
│                   # merci, mentions-legales, 404
└── styles/
    └── global.css  # Design tokens (8pt grid, échelle typo 1.25)
public/             # logos, favicons, og-image, robots.txt, .htaccess
deploy/             # workflow n8n + générateur OG + doc déploiement
```

## Design tokens (résumé)

- Grille **8 pt** (`--s-0` à `--s-10`, 0→128 px)
- Échelle typo **1.25** (`--step--1` à `--step-8`)
- Containers : `is-narrow` 640 · `is-default` 920 · `is-wide` 1200
- Palette : `--bg #0B0B0A`, `--ink #F4F4EF`, `--accent #D4FF4E` (lime), `--accent-2 #A6CC3E`

## Déploiement

Voir [`deploy/DEPLOY.md`](deploy/DEPLOY.md) pour la procédure Infomaniak pas-à-pas et [`deploy/n8n-diagnostic-form.json`](deploy/n8n-diagnostic-form.json) pour le workflow du formulaire.

## Licence

© Neuf Cinquante Huit — Tous droits réservés. Ça fait Tilt® est une marque déposée.
