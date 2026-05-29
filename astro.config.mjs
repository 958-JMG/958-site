// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.958.fr',
  output: 'static',
  integrations: [
    sitemap({
      // Exclure : anciens protos /preview/, pages de confirmation et 404
      filter: (page) =>
        !page.includes('/preview/') && !/\/(merci|404)\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
});
