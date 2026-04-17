#!/usr/bin/env bash
# Pousse le repo local 958-site vers github.com:958-JMG/958-site.
# Prérequis : avoir créé le repo vide sur https://github.com/new (958-JMG/958-site).

set -euo pipefail

cd "$(dirname "$0")/.."

REPO="git@github.com:958-JMG/958-site.git"

echo "→ Ajout du remote origin → $REPO"
if git remote get-url origin >/dev/null 2>&1; then
  echo "  (remote existe déjà, on met à jour)"
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

echo "→ Renomme la branche en 'main'"
git branch -M main

echo "→ Push initial"
git push -u origin main

echo "✓ Terminé. Repo : https://github.com/958-JMG/958-site"
