import { resolve } from 'node:path';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Genera robots.txt y sitemap.xml con la URL pública configurada. */
function seoFiles(siteUrl: string): Plugin {
  return {
    name: 'muvo-seo-files',
    apply: 'build',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || process.env.VITE_SITE_URL || 'https://muvo-grupo01.vercel.app').replace(/\/$/, '');
  process.env.VITE_SITE_URL = siteUrl;
  return {
    plugins: [seoFiles(siteUrl)],
    build: {
      target: 'es2020',
      rollupOptions: {
        input: { main: resolve(import.meta.dirname, 'index.html'), privacidad: resolve(import.meta.dirname, 'privacidad.html') },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts'],
    },
  };
});
