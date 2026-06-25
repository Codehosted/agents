export function generatePlaywrightScript(flow) {
  const baseUrl = flow.baseUrl ?? 'http://localhost:3000';
  const lines = [
    "import { mkdir } from 'node:fs/promises';",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    "import { test, expect } from '@playwright/test';",
    '',
    "test.use({ video: 'on' });",
    '',
    'const artifactDir = path.dirname(fileURLToPath(import.meta.url));',
    `const baseUrl = ${quote(baseUrl)};`,
    '',
    `test(${quote(flow.name ?? 'generated recorder flow')}, async ({ page }) => {`
  ];

  for (const step of flow.steps ?? []) {
    lines.push(...scriptLinesForStep(step));
  }

  lines.push('  await saveRequestedVideo(page);', '});', '', helperSource());
  return lines.join('\n');
}

function scriptLinesForStep(step) {
  const lines = [`  // ${step.id}: ${step.type.toUpperCase()} ${step.label ?? step.route ?? ''}`];

  if (step.type === 'visit') {
    lines.push(`  await page.goto(new URL(${quote(step.route ?? '/')}, baseUrl).toString());`);
    if (step.assertion?.startsWith('title contains ')) {
      const expected = step.assertion.match(/"([^"]+)"/)?.[1];
      if (expected) lines.push(`  await expect(page).toHaveTitle(/${escapeRegex(expected)}/);`);
    }
  }

  if (step.type === 'click') {
    lines.push(`  await page.locator(${quote(step.selector)}).click();`);
  }

  if (step.type === 'fill') {
    lines.push(`  await page.locator(${quote(step.selector)}).fill(${quote(step.value ?? '<value>')});`);
  }

  if (step.type === 'assert') {
    lines.push(`  await expect(page.locator(${quote(step.selector)})).toBeVisible();`);
  }

  if (step.screenshot) {
    lines.push(`  await saveStepScreenshot(page, ${quote(step.screenshot)});`);
  }

  lines.push('');
  return lines;
}

function helperSource() {
  return `async function saveStepScreenshot(page, screenshotPath) {
  const resolvedPath = path.resolve(artifactDir, screenshotPath);
  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await page.screenshot({ path: resolvedPath, fullPage: true });
}

async function saveRequestedVideo(page) {
  const video = page.video();
  if (!process.env.PLAYWRIGHT_VIDEO_PATH || !video) return;

  await mkdir(path.dirname(process.env.PLAYWRIGHT_VIDEO_PATH), { recursive: true });
  await page.close();
  await video.saveAs(process.env.PLAYWRIGHT_VIDEO_PATH);
}
`;
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
