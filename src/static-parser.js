import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const HTML_FILE_PATTERN = /\.html?$/i;

export function parseStaticSite(rootDir, options = {}) {
  const htmlFiles = collectHtmlFiles(rootDir);
  const pages = htmlFiles.map((filePath) => {
    const html = readFileSync(filePath, 'utf8');
    const route = routeFromFile(rootDir, filePath, options.baseRoute ?? '/');
    return parseHtmlPage(html, { route, filePath: path.relative(rootDir, filePath) });
  });

  return {
    source: path.resolve(rootDir),
    pages,
    elements: pages.flatMap((page) => page.elements.map((element) => ({ ...element, route: page.route })))
  };
}

export function parseHtmlPage(html, options = {}) {
  const route = options.route ?? '/';
  const filePath = options.filePath ?? route;
  const title = firstText(html, 'h1') || firstText(html, 'title') || route;
  const elements = discoverElements(html, route);

  return {
    route,
    filePath,
    title,
    screenshot: screenshotName(route, 'page'),
    elements
  };
}

function collectHtmlFiles(rootDir) {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(entryPath);
    return HTML_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  }).sort();
}

function routeFromFile(rootDir, filePath, baseRoute) {
  const relative = path.relative(rootDir, filePath).replaceAll(path.sep, '/');
  const withoutExtension = relative.replace(/\.html?$/i, '');
  const normalized = withoutExtension.endsWith('/index')
    ? withoutExtension.slice(0, -'/index'.length)
    : withoutExtension;
  const route = normalized === 'index' || normalized === '' ? '/' : `/${normalized}`;
  return path.posix.join(baseRoute, route).replace(/\/index$/, '/') || '/';
}

function discoverElements(html, route) {
  const elementPattern = /<(button|a|textarea|select)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*?)(?:\/?>)/gi;
  const elements = [];
  let match;

  while ((match = elementPattern.exec(html)) !== null) {
    const kind = (match[1] || match[4]).toLowerCase();
    const attributes = parseAttributes(match[2] || match[5] || '');
    const innerHtml = match[3] || '';
    const label = labelFor(attributes, innerHtml);
    const selector = selectorFor(attributes, kind, elements.length + 1);

    elements.push({
      id: attributes.id,
      testId: attributes['data-testid'],
      name: attributes.name,
      kind: kind === 'a' ? 'link' : kind,
      label,
      selector,
      href: attributes.href,
      route,
      screenshot: screenshotName(route, `${kind}-${elements.length + 1}`)
    });
  }

  return elements;
}

function parseAttributes(rawAttributes) {
  const attributes = {};
  const attributePattern = /([:\w-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;

  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    const [, name, , doubleQuoted, singleQuoted, unquoted] = match;
    attributes[name.toLowerCase()] = decodeHtml(doubleQuoted ?? singleQuoted ?? unquoted ?? '');
  }

  return attributes;
}

function labelFor(attributes, innerHtml) {
  return compactText(
    attributes['aria-label'] ||
    attributes.value ||
    attributes.placeholder ||
    stripTags(innerHtml) ||
    attributes.name ||
    attributes.id ||
    attributes['data-testid'] ||
    'unnamed element'
  );
}

function selectorFor(attributes, kind, fallbackIndex) {
  if (attributes.id) return `#${cssEscape(attributes.id)}`;
  if (attributes['data-testid']) return `[data-testid="${quoteEscape(attributes['data-testid'])}"]`;
  if (attributes.name) return `${kind}[name="${quoteEscape(attributes.name)}"]`;
  if (attributes['aria-label']) return `${kind}[aria-label="${quoteEscape(attributes['aria-label'])}"]`;
  return `${kind}:nth-of-type(${fallbackIndex})`;
}

function firstText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? compactText(stripTags(match[1])) : '';
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '));
}

function compactText(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cssEscape(value) {
  return String(value).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function quoteEscape(value) {
  return String(value).replace(/"/g, '\\"');
}

function screenshotName(route, suffix) {
  const routeSlug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page';
  return `screenshots/${routeSlug}-${suffix}.png`;
}
