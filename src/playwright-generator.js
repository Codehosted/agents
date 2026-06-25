export function generatePlaywrightScript(flow) {
  const baseUrl = flow.baseUrl ?? 'http://localhost:3000';
  const lines = [
    "import { test, expect } from '@playwright/test';",
    '',
    `const baseUrl = ${quote(baseUrl)};`,
    '',
    `test(${quote(flow.name ?? 'generated recorder flow')}, async ({ page }) => {`
  ];

  for (const step of flow.steps ?? []) {
    lines.push(...scriptLinesForStep(step));
  }

  lines.push('});', '');
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
    lines.push(`  await page.screenshot({ path: ${quote(step.screenshot)}, fullPage: true });`);
  }

  lines.push('');
  return lines;
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
