// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.958.fr',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/preview/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
});
