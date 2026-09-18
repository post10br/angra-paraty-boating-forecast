import { defineConfig } from 'vite';

// GitHub Pages serves from /angra-paraty-boating-forecast/ when using project pages
export default defineConfig({
  base: process.env.GITHUB_PAGES === '1' ? '/angra-paraty-boating-forecast/' : './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
