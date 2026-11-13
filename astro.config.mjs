import { defineConfig } from 'astro/config';
import { URL } from 'node:url';
import { isIP } from 'node:net';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { vehicles } from './src/data/vehicles.ts';

const base = process.env.ASTRO_BASE || '/';
const site = process.env.PUBLIC_SITE_URL || undefined;

if (site) {
  const url = new URL(site);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.hostname === 'github.io' ||
    url.hostname.endsWith('.github.io') ||
    url.hostname.endsWith('.githubusercontent.com') ||
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.endsWith('.local') ||
    url.hostname.endsWith('.test') ||
    url.hostname.endsWith('.invalid') ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '0.0.0.0' ||
    url.hostname === '[::1]' ||
    isIP(url.hostname.replace(/^\[|\]$/g, '')) ||
    !url.hostname.includes('.') ||
    url.hostname.endsWith('.internal') ||
    url.hostname === 'githubusercontent.com' ||
    url.hostname === 'github.dev' ||
    url.hostname.endsWith('.github.dev')
  ) {
    throw new Error(
      'PUBLIC_SITE_URL must be the verified HTTPS custom-domain origin, not a GitHub Pages or development URL.',
    );
  }
}

export default defineConfig({
  output: 'static',
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    react(),
    ...(site
      ? [
          sitemap({
            filter: (page) => {
              const basePath = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(
                /^\/$/,
                '',
              );
              const pathname = new URL(page).pathname;
              const relative =
                basePath && pathname.startsWith(`${basePath}/`)
                  ? pathname.slice(basePath.length)
                  : pathname;
              if (
                /^\/(booking|legal)(\/|$)/.test(relative) ||
                relative === '/404.html'
              )
                return false;
              return !vehicles.some(
                (vehicle) =>
                  vehicle.demonstration &&
                  relative === `/fleet/${vehicle.slug}/`,
              );
            },
          }),
        ]
      : []),
  ],
  vite: { plugins: [tailwindcss()] },
});
