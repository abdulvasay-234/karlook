import type { APIRoute } from 'astro';
import { pathFor } from '../lib/paths';

export const GET: APIRoute = ({ site }) => {
  const sitemap = site
    ? `\nSitemap: ${new URL(pathFor('/sitemap-index.xml'), site).href}\n`
    : '';
  return new Response(`User-agent: *\nAllow: /\n${sitemap}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
