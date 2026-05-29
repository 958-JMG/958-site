#!/usr/bin/env node
/**
 * make-og-image.mjs
 *
 * Génère public/og-958.png (1200×630) pour les meta Open Graph / Twitter Card.
 *
 * Composition :
 *   - Fond noir #0B0B0A avec un léger grain
 *   - Trait cuivre #C75F2D en haut (4px)
 *   - Logo 9·58 (depuis public/logo-958-official.png) recoloré en cuivre,
 *     centré-haut, hauteur 220px
 *   - Tagline Fraunces fallback Georgia :
 *       "On installe l'IA dans" (ivoire)
 *       "votre entreprise." (italic cuivre)
 *   - Footer mono "9·58 — VANNES & PARIS"
 *
 * Lance : node scripts/make-og-image.mjs
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const W = 1200;
const H = 630;

// Couleurs brand
const BG = '#0B0B0A';
const CUIVRE = '#C75F2D';
const IVOIRE = '#F4ECDC';
const INK_3 = '#A39977';

// 1. Charger le logo PNG transparent et le recolorer en cuivre via composite mode 'in'
//    (le 1×1 pixel cuivre tile partout, mode 'in' garde uniquement l'alpha du logo)
const logoPath = join(ROOT, 'public/logo-958-official.png');
const logoBuf = readFileSync(logoPath);

const LOGO_H = 220;

// Étape 1 : redimensionner le logo
const logoResized = await sharp(logoBuf)
  .resize({ height: LOGO_H, fit: 'inside' })
  .ensureAlpha()
  .toBuffer();

// Étape 2 : recolorer en cuivre via composite mode 'in'
const logoCuivre = await sharp(logoResized)
  .composite([{
    input: {
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: CUIVRE,
      },
    },
    tile: true,
    blend: 'in',
  }])
  .png()
  .toBuffer();

// Récupérer les dimensions réelles du logo après resize
const { width: logoW, height: logoH } = await sharp(logoCuivre).metadata();

// 2. SVG composition : fond + trait haut + textes
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Grain subtle -->
    <pattern id="grain" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="${BG}"/>
      <circle cx="1" cy="1" r="0.5" fill="#1A1815" opacity="0.6"/>
      <circle cx="4" cy="3" r="0.5" fill="#1A1815" opacity="0.4"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#grain)"/>

  <!-- Cuivre accent line top -->
  <rect x="0" y="0" width="${W}" height="4" fill="${CUIVRE}"/>

  <!-- Tagline : "On installe l'IA dans / votre entreprise." -->
  <text x="${W / 2}" y="445"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="56"
        font-weight="400"
        fill="${IVOIRE}">
    On installe l'IA dans
  </text>
  <text x="${W / 2}" y="515"
        text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="56"
        font-weight="400"
        font-style="italic"
        fill="${CUIVRE}">
    votre entreprise.
  </text>

  <!-- Footer signature mono -->
  <text x="${W / 2}" y="595"
        text-anchor="middle"
        font-family="'JetBrains Mono', 'SF Mono', 'Courier New', monospace"
        font-size="16"
        font-weight="500"
        letter-spacing="4"
        fill="${INK_3}">
    9·58 — VANNES &amp; PARIS
  </text>
</svg>`;

// 3. Composer : SVG bg → puis logo cuivre par-dessus, centré horizontalement, top 100
const svgBuf = Buffer.from(svg);

// Calcul de la position du logo (centré horizontalement)
const logoLeft = Math.round((W - logoW) / 2);
const logoTop = 100;

const finalBuf = await sharp(svgBuf)
  .composite([{
    input: logoCuivre,
    left: logoLeft,
    top: logoTop,
  }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const outPath = join(ROOT, 'public/og-958.png');
writeFileSync(outPath, finalBuf);

const stats = await sharp(finalBuf).metadata();
console.log(`✓ ${outPath}`);
console.log(`  ${stats.width}×${stats.height} · ${(finalBuf.length / 1024).toFixed(1)} ko`);
