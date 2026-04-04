import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mines-path.jp',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
