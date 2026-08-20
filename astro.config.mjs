import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // Used for canonical URLs. Replace with your real domain.
  site: 'https://yourdomain.com',
  integrations: [react()],
  build: {
    // Produces /skips/slug/index.html: clean URLs on Apache, no rewrite rules.
    format: 'directory',
  },
});
