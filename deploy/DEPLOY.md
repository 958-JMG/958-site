# Déployer 958.fr — Infomaniak + n8n

**Objectif** : site statique sur Infomaniak, formulaire branché sur n8n, déploiement automatique via Git.

Temps estimé : **15 min** pour la mise en place initiale, puis **0 min** pour chaque déploiement suivant (push = live).

---

## 1. Préparer le repo GitHub (2 min)

### 1.1. Créer le repo

Sur [github.com/new](https://github.com/new) :

- **Repository name** : `958-site`
- **Owner** : `958-JMG`
- **Visibility** : Private (ou Public si tu veux)
- **⚠️ Ne cocher aucune case** (pas de README, pas de .gitignore, pas de licence — on pousse l'historique existant)

### 1.2. Pousser le code (depuis le dossier `958-site/`)

Les commandes sont prêtes dans [`push-to-github.sh`](./push-to-github.sh) — ou manuellement :

```bash
cd 958-site
git remote add origin git@github.com:958-JMG/958-site.git
git branch -M main
git push -u origin main
```

---

## 2. Importer le workflow n8n (3 min)

### 2.1. Importer le JSON

Dans ta console n8n Cloud ([jmg958.app.n8n.cloud](https://jmg958.app.n8n.cloud)) :

1. **Workflows** → **Add workflow** → menu **⋯** → **Import from File**
2. Sélectionner [`deploy/n8n-diagnostic-form.json`](./n8n-diagnostic-form.json)
3. Sauvegarder (**Ctrl+S**)

### 2.2. Brancher le SMTP Infomaniak (le seul credential à configurer)

Sur le node **Email · jmg@958.fr** :

1. Cliquer le node → **Credential → Create New**
2. **Host** : `mail.infomaniak.com`
3. **Port** : `465`
4. **User** : `jmg@958.fr`
5. **Password** : mot de passe de ton compte mail Infomaniak
6. **SSL/TLS** : activé
7. **Save** → renommer la credential « SMTP Infomaniak »

### 2.3. Activer le workflow

- Basculer le **toggle** en haut à droite → **Active**
- **Copier l'URL du webhook** affichée dans le node **Webhook · diagnostic-site** (section *Production URL*, pas Test URL)

L'URL ressemble à :
```
https://jmg958.app.n8n.cloud/webhook/diagnostic-site
```

---

## 3. Créer l'hébergement Infomaniak (5 min)

> Si tu as déjà un hébergement pour 958.fr, saute en 3.3.

### 3.1. Nouveau site

Console Infomaniak → **Hébergement Web** → **Ajouter un site** :

- **Nom de domaine** : `958.fr`
- **Emplacement** : `/sites/958.fr/` (ou équivalent)
- **Version PHP** : la plus récente (même si on n'en fait pas usage, c'est l'hébergeur par défaut)

### 3.2. SSL

Activer **Let's Encrypt** automatique (HTTPS forcé est déjà dans `.htaccess`).

### 3.3. Déploiement automatique Git

Console Infomaniak → ton site → **Déploiement automatique via Git** :

1. **Ajouter un dépôt Git**
2. **Fournisseur** : GitHub
3. **Autoriser Infomaniak** à lire ton compte (OAuth)
4. **Repository** : `958-JMG/958-site`
5. **Branche** : `main`
6. **Mode de déploiement** :
   - Si Infomaniak propose « Build via Node » : **commande** `pnpm install && pnpm build`, **dossier de sortie** `dist`
   - Sinon (déploiement direct) : voir plan B ci-dessous (GitHub Action)

### 3.4. Variables d'environnement

Dans la config du déploiement, ajouter :

| Clé | Valeur |
|---|---|
| `PUBLIC_N8N_WEBHOOK_DIAGNOSTIC` | *URL copiée à l'étape 2.3* |

---

### Plan B — Si Infomaniak ne fait pas le build Node

Utiliser **GitHub Actions** pour builder et pousser `dist/` en FTP vers Infomaniak.

Ajouter dans le repo `.github/workflows/deploy.yml` :

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
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          PUBLIC_N8N_WEBHOOK_DIAGNOSTIC: ${{ secrets.N8N_WEBHOOK }}
      - name: FTP deploy
        uses: SamKirkland/FTP-Deploy-Action@v4
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./sites/958.fr/
```

Secrets GitHub à créer (*Settings → Secrets and variables → Actions*) :

- `N8N_WEBHOOK` → l'URL du webhook
- `FTP_HOST` → `ftp.infomaniak.com` (ou l'hôte fourni par Infomaniak)
- `FTP_USER` → nom d'utilisateur FTP Infomaniak
- `FTP_PASSWORD` → mot de passe FTP Infomaniak

---

## 4. DNS 958.fr (5 min si le domaine n'est pas déjà chez Infomaniak)

**URL canonique : `https://www.958.fr`** · L'apex `958.fr` redirige en 301 vers le www (cf `.htaccess`).
Donc les **deux** doivent pointer vers l'hébergement Infomaniak.

Si le domaine 958.fr est ailleurs (OVH, Gandi, Squarespace, etc.) :

1. Récupérer les **IP Infomaniak** affichées dans la console Infomaniak (Hébergement → Informations)
2. Chez ton registrar actuel, éditer les DNS :
   - **A record** : `@` → IP Infomaniak
   - **A record** : `www` → IP Infomaniak (ou CNAME `www` → `958.fr.`)
3. Activer **Let's Encrypt** pour **les deux** : `958.fr` et `www.958.fr` (sinon la redirection HTTPS apex→www casse)
4. Attendre la propagation (quelques minutes à 24 h)

Une fois propagé + SSL généré sur les deux noms :
- [https://www.958.fr](https://www.958.fr) → site en ligne ✓
- [https://958.fr](https://958.fr) → redirige en 301 vers www ✓
- [http://www.958.fr](http://www.958.fr) → redirige en 301 vers https ✓
- [http://958.fr](http://958.fr) → redirige en 301 vers https://www ✓

---

## 5. Vérifications post-déploiement

- [ ] [https://www.958.fr](https://www.958.fr) s'ouvre en HTTPS
- [ ] [https://958.fr](https://958.fr) redirige bien vers `https://www.958.fr`
- [ ] Les 8 pages répondent en 200 : `/`, `/methode`, `/realisations`, `/diagnostic`, `/faq`, `/merci`, `/mentions-legales` + une route inexistante → 404 custom
- [ ] Le formulaire diagnostic envoie bien un email (tester avec ton propre email)
- [ ] [https://958.fr/sitemap-index.xml](https://958.fr/sitemap-index.xml) existe
- [ ] [https://958.fr/robots.txt](https://958.fr/robots.txt) accessible
- [ ] La preview Open Graph s'affiche correctement : tester sur [opengraph.xyz/url/https://958.fr](https://www.opengraph.xyz/url/https%3A%2F%2F958.fr)

---

## 6. Déploiements suivants

```bash
git add .
git commit -m "…"
git push
```

Infomaniak (ou l'action GitHub) reconstruit et déploie automatiquement en **1 à 3 min**.

---

## Annexes

- **Workflow n8n** : [`n8n-diagnostic-form.json`](./n8n-diagnostic-form.json)
- **Script OG image** : [`generate-og.mjs`](./generate-og.mjs) — relancer avec `node deploy/generate-og.mjs` si tu changes le visuel
- **`.htaccess`** : déjà prêt à la racine pour Apache Infomaniak (HTTPS forcé, redirections SEO Squarespace → Astro, 404 custom)
