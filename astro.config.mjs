import { defineConfig } from 'astro/config';
export default defineConfig({
  // Astro 7 compresse par défaut selon les règles JSX ('jsx') : il retire des espaces
  // entre éléments et colle des mots. true = la compression sans perte d'Astro 5.
  compressHTML: true,
});
