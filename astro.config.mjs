import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const DETAIL_SECTIONS = ['skips', 'stickers', 'techniques'];
const DETAIL_RESERVED_SLUGS = new Set(['submit', 'view']); // real sub-routes, not item slugs

// dev-only stand-in for public/.htaccess's rewrite: astro's dev server has no notion of apache rules,
// so without this /skips/<slug>/ 404s locally even though it'll work fine once deployed
function detailRewriteDevMiddleware() {
  return {
    name: 'detail-rewrite-dev-middleware',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const path = req.url.split('?')[0];
          const parts = path.split('/').filter(Boolean);

          if (parts.length === 2 && DETAIL_SECTIONS.includes(parts[0]) && !DETAIL_RESERVED_SLUGS.has(parts[1])) {
            req.url = `/${parts[0]}/view/`;
          }

          next();
        });
      },
    },
  };
}

export default defineConfig({
  // canonical urls, og tags, sitemap — replace with your real domain
  site: 'https://yourdomain.com',
  integrations: [
    react(),
    detailRewriteDevMiddleware(),
    sitemap({
      // /skips/view/, /stickers/view/, /techniques/view/ are content-less templates now (data is fetched
      // client-side per slug), no individual item urls exist anymore to list instead — see public/.htaccess
      filter: (page) => !page.endsWith('/view/'),
    }),
  ],
  build: {
    format: 'directory', // clean urls on apache (/skips/slug/index.html)
  },
  prefetch: {
    prefetchAll: true, // same-origin links only, so catalog -> detail feels instant
    defaultStrategy: 'hover',
  },
});
