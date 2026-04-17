# Déployer 958.fr — Cloudflare Pages + n8n

**Stack de déploiement** :
- **Code** : GitHub (`958-JMG/958-site`)
- **Hébergement** : Cloudflare Pages (gratuit, CDN mondial)
- **DNS** : Infomaniak (on garde, pas de migration de NS)
- **Formulaire** : webhook n8n

**Canonique** : `https://www.958.fr` (l'apex `958.fr` redirige en 301 vers le www via `.htaccess`… oui mais CF Pages ne lit pas `.htaccess`, du coup on gère la redirection différemment — voir §4)

Temps total : **~15 min** pour le premier setup, puis **0 min** pour chaque push suivant.

---

## 1. Importer le workflow n8n (3 min)

### 1.1. Import du JSON

Dans ta console n8n ([jmg958.app.n8n.cloud](https://jmg958.app.n8n.cloud)) :

1. **Workflows** → **Add workflow** → menu **⋯** → **Import from File**
2. Sélectionner [`deploy/n8n-diagnostic-form.json`](./n8n-diagnostic-form.json)
3. Ctrl+S

### 1.2. Brancher l'envoi d'email (Gmail au lieu de SMTP Proton)

Sur le node **Email · jmg@958.fr** :

1. Changer le type du node de **Send Email (SMTP)** → **Gmail** (tu l'as déjà configuré côté Claude/MCP)
2. Mapper les champs :
   - **To** : `jmg@958.fr`
   - **Subject** : `[958] Nouveau diagnostic · {{$json.nom}} — {{$json.entreprise}}`
   - **Message** : copier le HTML du node d'origine
   - **Reply-To** : `{{$json.email}}`

### 1.3. Activer le workflow et copier l'URL

- Toggle en haut à droite → **Active**
- Copier la **Production URL** affichée dans le node **Webhook · diagnostic-site**
- L'URL ressemble à : `https://jmg958.app.n8n.cloud/webhook/diagnostic-site`
- **Garde-la sous la main** — elle servira à l'étape 3

---

## 2. Créer le projet Cloudflare Pages (5 min)

### 2.1. Compte Cloudflare

Si tu n'en as pas déjà un : [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) (gratuit, email + mot de passe, 30 sec).

### 2.2. Connecter GitHub et déployer

1. Dashboard Cloudflare → menu gauche → **Workers & Pages**
2. **Create** → onglet **Pages** → **Connect to Git**
3. **Authorize Cloudflare** sur GitHub (pop-up OAuth) — tu peux limiter l'accès au seul repo `958-JMG/958-site`
4. Sélectionner le repo **`958-JMG/958-site`** → **Begin setup**

### 2.3. Configuration du build

| Champ | Valeur |
|---|---|
| **Project name** | `958-site` (deviendra `958-site.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `Astro` (détecté auto) |
| **Build command** | `pnpm install && pnpm build` |
| **Build output directory** | `dist` |
| **Root directory** | *(laisser vide)* |
| **Environment variables** → **Add variable** | **Name** : `PUBLIC_N8N_WEBHOOK_DIAGNOSTIC` · **Value** : *l'URL du webhook n8n copiée à l'étape 1.3* |

Bouton **Save and Deploy**.

Le premier build prend ~1 min. À la fin, tu as une URL live du type :
```
https://958-site.pages.dev
```

**Ouvre-la** et vérifie que le site s'affiche bien avant de passer à l'étape 3.

---

## 3. Brancher `www.958.fr` et `958.fr` (5 min)

### 3.1. Ajouter les domaines custom dans Cloudflare

Dans le projet `958-site` → onglet **Custom domains** → **Set up a custom domain** :

1. Ajouter **`www.958.fr`** → Continue
2. CF affiche un **CNAME** à créer dans ton DNS Infomaniak (type : `958-site.pages.dev` ou équivalent)

Puis :

3. Re-cliquer **Set up a custom domain**
4. Ajouter **`958.fr`** (l'apex) → Continue
5. CF te dira soit :
   - (a) « Add these A records » avec 2 IPs Cloudflare, OU
   - (b) « CNAME flattening required, move NS to Cloudflare »

### 3.2. Éditer la zone DNS chez Infomaniak

Dans la console Infomaniak → **Domaines** → **958.fr** → **Zone DNS** :

**Supprimer** (héritage Squarespace, périmé) :

| Source | Type | Valeur |
|---|---|---|
| `958.fr` | A | `198.185.159.144` |
| `958.fr` | A | `198.185.159.145` |
| `958.fr` | A | `198.49.23.144` |
| `958.fr` | A | `198.49.23.145` |
| `www.958.fr` | CNAME | `ext-cust.squarespace.com` |
| `xd3l7er5prybcc6zgtpn.958.fr` | CNAME | `verify.squarespace.com` |

**Ajouter** (valeurs exactes dictées par Cloudflare à l'étape 3.1) :

| Source | Type | Valeur |
|---|---|---|
| `www.958.fr` | CNAME | `958-site.pages.dev` *(valeur CF)* |
| `958.fr` | A | *1re IP CF* |
| `958.fr` | A | *2e IP CF* |

**À ne PAS toucher** (emails Proton, MailerLite, vérifs Google/OpenAI/Dust, DMARC) — ces lignes doivent rester telles quelles.

### 3.3. Retour dans Cloudflare

Dans Custom domains, CF va vérifier la propagation (1-5 min). Les deux domaines passent au statut **Active** avec SSL auto.

### 3.4. Redirection apex → www

Comme CF Pages ne lit pas `.htaccess`, il faut créer une règle de redirection :

Dashboard Cloudflare → domaine `958.fr` (il doit apparaître automatiquement quand tu ajoutes le custom domain apex) → **Rules** → **Redirect Rules** → **Create rule** :

- **Name** : Apex vers www
- **When incoming requests match** : Custom filter expression
  - Field : Hostname · Operator : equals · Value : `958.fr`
- **Then** : Static redirect
  - Type : Dynamic
  - Expression : `concat("https://www.958.fr", http.request.uri.path)`
  - Status : 301

Deploy.

---

## 4. Vérifications post-déploiement

Ouvre chaque URL dans un onglet privé :

- [ ] [https://www.958.fr](https://www.958.fr) → site en ligne, SSL vert
- [ ] [https://958.fr](https://958.fr) → redirige en 301 vers `https://www.958.fr`
- [ ] [http://www.958.fr](http://www.958.fr) → redirige vers HTTPS
- [ ] Les 8 pages répondent : `/`, `/methode`, `/realisations`, `/diagnostic`, `/faq`, `/merci`, `/mentions-legales` + une route inexistante → 404 custom
- [ ] **Formulaire diagnostic** : remplir + envoyer → tu dois recevoir l'email sur jmg@958.fr + page `/merci` s'affiche
- [ ] [https://www.958.fr/sitemap-index.xml](https://www.958.fr/sitemap-index.xml)
- [ ] Preview OG : [opengraph.xyz/url/https://www.958.fr](https://www.opengraph.xyz/url/https%3A%2F%2Fwww.958.fr)

---

## 5. Déploiements suivants (zéro clic)

```bash
git add .
git commit -m "…"
git push
```

Cloudflare rebuilde + déploie en ~1 min. Tu peux suivre le build dans **Workers & Pages → 958-site → Deployments**.

Chaque PR ouverte génère aussi automatiquement une **preview URL** type `https://<branch>.958-site.pages.dev` — pratique pour valider avant merge.

---

## Annexes

### Limites du plan gratuit Cloudflare Pages
- **500 builds/mois** (largement assez)
- **Bande passante illimitée**
- **20 000 fichiers** par projet
- **Custom domains illimités**

### Si un jour tu veux migrer sur Infomaniak Web Hosting
Tout est réversible :
1. Créer un hébergement Web Infomaniak (≈ 7 €/mois)
2. Build en GitHub Action → FTP vers Infomaniak (config prête ci-dessous)
3. Bascule DNS → IP Infomaniak
4. Annuler CF Pages

**GitHub Action FTP (plan B)** — à créer dans `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Infomaniak
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          PUBLIC_N8N_WEBHOOK_DIAGNOSTIC: ${{ secrets.N8N_WEBHOOK }}
      - uses: SamKirkland/FTP-Deploy-Action@v4
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./sites/958.fr/
```

### Fichiers du repo liés au déploiement
- [`n8n-diagnostic-form.json`](./n8n-diagnostic-form.json) — workflow à importer
- [`generate-og.mjs`](./generate-og.mjs) — régénère `public/og-image.png` si tu changes le visuel
- [`push-to-github.sh`](./push-to-github.sh) — helper initial (plus besoin après le premier push)
- [`../.htaccess`](../.htaccess) — devient inutile avec Cloudflare Pages, mais on le garde au cas où
