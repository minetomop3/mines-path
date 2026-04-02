import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://minetomop3.github.io',
  base: '/mines-path',
  output: 'static',
  build: {
    assets: '_assets',
  },
});
