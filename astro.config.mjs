import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Used for canonical URLs, Open Graph tags, and the sitemap below.
  // Replace with your real domain, and update public/robots.txt to match.
  site: 'https://yourdomain.com',
  integrations: [react(), sitemap()],
  build: {
    // Produces /skips/slug/index.html: clean URLs on Apache, no rewrite rules.
    format: 'directory',
  },
  prefetch: {
    // Prefetches every same-origin link's HTML on hover (harmless for
    // external links: only same-origin ones are ever fetched), so catalog
    // -> detail navigation feels closer to instant.
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
