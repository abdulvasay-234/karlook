import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import console from 'node:console';
import { parse } from 'parse5';
import sax from 'sax';
import { business } from '../src/data/site.ts';
import { vehicles } from '../src/data/vehicles.ts';
import { services } from '../src/data/services.ts';

const root = path.resolve('dist');
const base =
  `/${(process.env.ASTRO_BASE || '/').replace(/^\/+|\/+$/g, '')}`.replace(
    /^\/$/,
    '',
  );
const origin = process.env.PUBLIC_SITE_URL || '';
const issues = [];
const pages = new Map();
const titles = new Map();
const descriptions = new Map();

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    ),
  );
  return nested.flat();
}
function attrs(node) {
  return Object.fromEntries(
    (node.attrs || []).map((attribute) => [attribute.name, attribute.value]),
  );
}
function nodes(node, result = []) {
  result.push(node);
  for (const child of node.childNodes || []) nodes(child, result);
  return result;
}
function text(node) {
  return (node.value || '') + (node.childNodes || []).map(text).join('');
}
function addDuplicate(map, value, route, label) {
  if (map.has(value))
    issues.push(`${route}: duplicate ${label} with ${map.get(value)}`);
  else map.set(value, route);
}
function xmlLocations(xml) {
  const parser = sax.parser(true);
  const values = [];
  let inLocation = false;
  let value = '';
  parser.onopentag = (tag) => {
    if (tag.name === 'loc') {
      inLocation = true;
      value = '';
    }
  };
  parser.ontext = (part) => {
    if (inLocation) value += part;
  };
  parser.onclosetag = (name) => {
    if (name === 'loc') {
      values.push(value);
      inLocation = false;
    }
  };
  parser.write(xml).close();
  return values;
}
async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

const files = await walk(root);
for (const file of files.filter((entry) => entry.endsWith('.html'))) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const route =
    relative === 'index.html'
      ? '/'
      : relative.endsWith('/index.html')
        ? `/${relative.slice(0, -'index.html'.length)}`
        : `/${relative}`;
  const all = nodes(parse(await readFile(file, 'utf8')));
  const find = (tag) => all.filter((node) => node.tagName === tag);
  const titleNodes = find('title');
  const title = titleNodes[0] ? text(titleNodes[0]).trim() : '';
  const metas = find('meta').map(attrs);
  const meta = (name) =>
    metas.find((item) => item.name === name)?.content || '';
  const description = meta('description');
  const robots = meta('robots').toLowerCase();
  const canonical = find('link')
    .map(attrs)
    .filter((item) => item.rel === 'canonical');
  const headings = all.filter((node) => /^h[1-6]$/.test(node.tagName || ''));
  const links = find('a')
    .map(attrs)
    .map((item) => item.href)
    .filter(Boolean);
  const ids = new Set(
    all
      .map(attrs)
      .map((item) => item.id)
      .filter(Boolean),
  );
  if (attrs(find('html')[0] || {}).lang !== 'en-AU')
    issues.push(`${route}: incorrect document language`);
  if (titleNodes.length !== 1 || !title)
    issues.push(`${route}: missing or duplicate title`);
  if (
    !description ||
    metas.filter((item) => item.name === 'description').length !== 1
  )
    issues.push(`${route}: missing or duplicate description`);
  if (!robots) issues.push(`${route}: missing robots directive`);
  if (title) addDuplicate(titles, title, route, 'title');
  if (description)
    addDuplicate(descriptions, description, route, 'description');
  if (headings.filter((node) => node.tagName === 'h1').length !== 1)
    issues.push(`${route}: expected exactly one H1`);
  for (let index = 1; index < headings.length; index++)
    if (
      Number(headings[index].tagName[1]) >
      Number(headings[index - 1].tagName[1]) + 1
    )
      issues.push(
        `${route}: heading hierarchy jumps from ${headings[index - 1].tagName} to ${headings[index].tagName}`,
      );
  for (const image of find('img')) {
    const item = attrs(image);
    if (!('alt' in item) || /^(image\s*\d*|photo\s*\d*)$/i.test(item.alt))
      issues.push(`${route}: missing or generic image alt`);
    if (!item.width || !item.height)
      issues.push(
        `${route}: image lacks dimensions: ${item.src || '(missing src)'}`,
      );
    if (
      item.src?.includes('/images/optimised/') &&
      (!item.srcset || !item.sizes)
    )
      issues.push(
        `${route}: responsive image lacks srcset or sizes: ${item.src}`,
      );
    const sources = [
      item.src,
      ...(item.srcset || '')
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0]),
    ].filter(Boolean);
    for (const source of sources) {
      const imageUrl = new URL(source, `https://audit.invalid${base}${route}`);
      if (imageUrl.origin === 'https://audit.invalid') {
        if (base && !imageUrl.pathname.startsWith(`${base}/`))
          issues.push(`${route}: image missing base path: ${source}`);
        else if (
          !(await exists(
            path.join(
              root,
              decodeURIComponent(
                base ? imageUrl.pathname.slice(base.length) : imageUrl.pathname,
              ).replace(/^\/+/, ''),
            ),
          ))
        )
          issues.push(`${route}: missing image ${source}`);
      }
    }
  }
  const schemas = [];
  for (const script of find('script').filter(
    (node) => attrs(node).type === 'application/ld+json',
  )) {
    try {
      schemas.push(JSON.parse(text(script)));
    } catch {
      issues.push(`${route}: invalid JSON-LD`);
    }
  }
  if (schemas.some((item) => ['FAQPage', 'Product'].includes(item['@type'])))
    issues.push(`${route}: unsupported structured data type`);
  if (
    !business.verifiedLocalBusiness &&
    schemas.some((item) => item['@type'] === 'LocalBusiness')
  )
    issues.push(`${route}: unverified LocalBusiness markup`);
  const service = services.find((item) => route === `/services/${item.slug}/`);
  if (
    service &&
    !service.verified &&
    schemas.some((item) => item['@type'] === 'Service')
  )
    issues.push(`${route}: unverified Service markup`);
  const vehicle = vehicles.find((item) => route === `/fleet/${item.slug}/`);
  if (vehicle?.demonstration && !robots.includes('noindex'))
    issues.push(`${route}: illustrative vehicle must be noindex`);
  if (
    origin &&
    (!schemas.some((item) =>
      ['Organization', 'LocalBusiness'].includes(item['@type']),
    ) ||
      !schemas.some((item) => item['@type'] === 'WebSite'))
  )
    issues.push(`${route}: missing site entity structured data`);
  if (
    origin &&
    route !== '/' &&
    !robots.includes('noindex') &&
    !schemas.some((item) => item['@type'] === 'BreadcrumbList')
  )
    issues.push(`${route}: missing breadcrumb structured data`);
  if (
    origin &&
    !['og:title', 'og:description', 'og:image', 'og:url'].every((property) =>
      metas.some((item) => item.property === property && item.content),
    )
  )
    issues.push(`${route}: incomplete Open Graph metadata`);
  if (
    origin &&
    route !== '/404.html' &&
    metas.find((item) => item.property === 'og:url')?.content !==
      canonical[0]?.href
  )
    issues.push(`${route}: Open Graph URL does not match canonical`);
  if (
    !['twitter:card', 'twitter:title', 'twitter:description'].every((name) =>
      meta(name),
    )
  )
    issues.push(`${route}: incomplete Twitter metadata`);
  if (origin && route !== '/404.html') {
    const expected = new URL(`${base}${route}`, origin).href;
    if (canonical.length !== 1 || canonical[0].href !== expected)
      issues.push(`${route}: incorrect canonical (expected ${expected})`);
  }
  if (!origin && (canonical.length || !robots.includes('noindex')))
    issues.push(`${route}: preview must be noindex and omit canonical`);
  pages.set(route, { links, ids, robots, canonical: canonical[0]?.href });
}
for (const [route, page] of pages) {
  for (const href of page.links) {
    let url;
    try {
      url = new URL(href, `https://audit.invalid${base}${route}`);
    } catch {
      issues.push(`${route}: invalid link ${href}`);
      continue;
    }
    if (url.origin !== 'https://audit.invalid') continue;
    if (base && url.pathname !== base && !url.pathname.startsWith(`${base}/`)) {
      issues.push(`${route}: link missing base path: ${href}`);
      continue;
    }
    const target = base ? url.pathname.slice(base.length) || '/' : url.pathname;
    const targetPage = pages.get(target);
    if (targetPage) {
      if (
        url.hash &&
        !targetPage.ids.has(decodeURIComponent(url.hash.slice(1)))
      )
        issues.push(`${route}: missing anchor ${href}`);
    } else if (
      !(await exists(
        path.join(root, decodeURIComponent(target).replace(/^\/+/, '')),
      ))
    )
      issues.push(`${route}: broken link ${href}`);
  }
}
const reachable = new Set(['/']);
const queue = ['/'];
while (queue.length) {
  const route = queue.shift();
  for (const href of pages.get(route)?.links || []) {
    const url = new URL(href, `https://audit.invalid${base}${route}`);
    if (
      url.origin !== 'https://audit.invalid' ||
      (base && url.pathname !== base && !url.pathname.startsWith(`${base}/`))
    )
      continue;
    const target = base ? url.pathname.slice(base.length) || '/' : url.pathname;
    if (pages.has(target) && !reachable.has(target)) {
      reachable.add(target);
      queue.push(target);
    }
  }
}
for (const [route, page] of pages)
  if (!page.robots.includes('noindex') && !reachable.has(route))
    issues.push(
      `${route}: indexable page is not discoverable from internal links`,
    );
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!/User-agent:\s*\*/i.test(robots) || /Disallow:\s*\//i.test(robots))
  issues.push('robots.txt: invalid crawler directives');
if (origin) {
  const index = xmlLocations(
    await readFile(path.join(root, 'sitemap-index.xml'), 'utf8'),
  );
  if (
    !index.length ||
    !robots.includes(new URL(`${base}/sitemap-index.xml`, origin).href)
  )
    issues.push('sitemap index or robots sitemap URL is incorrect');
  const urls = [];
  for (const entry of index) {
    const url = new URL(entry);
    if (
      url.origin !== new URL(origin).origin ||
      !url.pathname.startsWith(`${base}/sitemap-`)
    ) {
      issues.push(`invalid sitemap index URL: ${entry}`);
      continue;
    }
    urls.push(
      ...xmlLocations(
        await readFile(
          path.join(root, url.pathname.slice(base.length).replace(/^\/+/, '')),
          'utf8',
        ),
      ),
    );
  }
  const expected = [...pages.values()]
    .filter((page) => !page.robots.includes('noindex'))
    .map((page) => page.canonical)
    .filter(Boolean);
  if (
    new Set(urls).size !== urls.length ||
    urls.length !== expected.length ||
    urls.some((url) => !expected.includes(url))
  )
    issues.push('sitemap URLs do not match indexable generated pages');
} else if (await exists(path.join(root, 'sitemap-index.xml')))
  issues.push('preview unexpectedly contains a sitemap');
if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else console.log(`SEO audit passed for ${pages.size} generated HTML pages.`);
