// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.958.fr',
  output: 'static',
  integrations: [
    sitemap({
      // Exclure : protos /preview/ + /v3/ (refonte en cours, non indexée),
      // pages de confirmation et 404
      filter: (page) =>
        !page.includes('/preview/') && !page.includes('/v3/') &&
        !/\/(merci|404)\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
});
