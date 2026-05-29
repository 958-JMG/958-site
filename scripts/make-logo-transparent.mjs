/**
 * Convertit LOGO958.jpg → public/logo-958-official.png avec :
 * - Fond blanc rendu transparent
 * - Le rect noir + chiffres blancs sont préservés
 * - Trim automatique des bords transparents pour cadrer le logo
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = '/Users/jmg/Desktop/Cockpit 958/LOGO958.jpg';
const DEST = resolve(process.cwd(), 'public/logo-958-official.png');

const THRESHOLD = 240; // pixels avec R, G, B tous >= seuil → transparent

async function run() {
  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 4 (RGBA)
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      out[i + 3] = 0; // alpha = 0
    }
  }

  await sharp(out, {
    raw: { width: info.width, height: info.height, channels: channels },
  })
    .trim()
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(DEST);

  console.log(`✓ Logo transparent généré : ${DEST}`);
  const stats = sharp(DEST);
  const meta = await stats.metadata();
  console.log(`  Dimensions : ${meta.width}×${meta.height}px`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
