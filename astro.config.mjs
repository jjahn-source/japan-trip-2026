// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { serviceWorker } from './scripts/service-worker.mjs';

// BASE lets the site live under a sub-path (e.g. GitHub Pages: BASE=/japan-plan-c/).
const base = process.env.BASE ?? '/';

export default defineConfig({
  output: 'static',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [svelte(), serviceWorker()],
});
