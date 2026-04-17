// Génère public/og-image.png (1200×630) à partir d'un SVG inline.
// Exécuter depuis 958-site/ : node deploy/generate-og.mjs

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'public', 'og-image.png');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.035 0"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0B0B0A"/>
  <rect width="1200" height="630" filter="url(#grain)"/>

  <!-- Subtle grid marker bottom-left -->
  <g opacity="0.22" font-family="monospace" font-size="14" fill="#868680" letter-spacing="2">
    <text x="72" y="580">47.6587° N · 2.7603° W</text>
    <text x="72" y="600">NEUF · CINQUANTE · HUIT</text>
  </g>

  <!-- Lime accent marker right -->
  <g>
    <rect x="1060" y="60" width="60" height="3" fill="#D4FF4E"/>
    <text x="1060" y="96" font-family="monospace" font-size="13" fill="#B8B8B1" letter-spacing="2">CONSEIL&#160;IA · 958.FR</text>
  </g>

  <!-- Mark (left) — 9·58 -->
  <g transform="translate(72, 164) scale(0.7)">
    <rect width="200" height="300" rx="18" fill="#F4F4EF"/>
    <circle cx="110" cy="82" r="56" fill="#F4F4EF"/>
    <circle cx="110" cy="82" r="56" fill="none" stroke="#0B0B0A" stroke-width="28"/>
    <circle cx="110" cy="82" r="28" fill="#F4F4EF"/>
    <rect x="88" y="110" width="44" height="60" fill="#0B0B0A"/>
    <rect x="40" y="136" width="24" height="24" fill="#0B0B0A"/>
    <circle cx="110" cy="222" r="56" fill="#0B0B0A"/>
    <circle cx="110" cy="222" r="28" fill="#F4F4EF"/>
    <rect x="138" y="200" width="62" height="44" fill="#F4F4EF"/>
    <circle cx="145" cy="250" r="20" fill="#F4F4EF"/>
  </g>

  <!-- Title (right) -->
  <g>
    <text x="260" y="240" font-family="Georgia, 'Times New Roman', serif" font-weight="500" font-size="72" fill="#F4F4EF" letter-spacing="-2">
      On installe l&#8217;IA
    </text>
    <text x="260" y="320" font-family="Georgia, 'Times New Roman', serif" font-weight="500" font-size="72" fill="#F4F4EF" letter-spacing="-2">
      dans votre entreprise.
    </text>
    <text x="260" y="392" font-family="Georgia, serif" font-style="italic" font-weight="400" font-size="40" fill="#B8B8B1">
      Sans bruit, sans jargon, sans dépendance.
    </text>

    <!-- Lime signature -->
    <rect x="260" y="448" width="56" height="3" fill="#D4FF4E"/>
    <text x="260" y="498" font-family="Georgia, serif" font-style="italic" font-weight="400" font-size="28" fill="#D4FF4E">
      Et là, ça fait tilt<tspan fill="#D4FF4E">.</tspan>
    </text>
  </g>
</svg>
`;

const buf = await sharp(Buffer.from(svg))
  .png({ quality: 92, compressionLevel: 9 })
  .toBuffer();

await writeFile(out, buf);
console.log('✓ Generated', out, '(', buf.length, 'bytes )');
