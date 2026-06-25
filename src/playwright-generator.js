export function generatePlaywrightScript(flow) {
  const baseUrl = flow.baseUrl ?? 'http://localhost:3000';
  const lines = [
    "import { mkdir, rm } from 'node:fs/promises';",
    "import { execFile } from 'node:child_process';",
    "import path from 'node:path';",
    "import { promisify } from 'node:util';",
    "import { fileURLToPath } from 'node:url';",
    "import { test, expect } from '@playwright/test';",
    '',
    "test.use({ video: 'on' });",
    '',
    'const artifactDir = path.dirname(fileURLToPath(import.meta.url));',
    'const execFileAsync = promisify(execFile);',
    "const recorderStepDelayMs = Number(process.env.AGENTS_RECORDER_STEP_DELAY_MS ?? '900');",
    "const recorderMouseMoveMs = Number(process.env.AGENTS_RECORDER_MOUSE_MOVE_MS ?? '700');",
    'const recorderMouseSteps = Math.max(8, Math.round(recorderMouseMoveMs / 16));',
    "const recorderKeystrokeDelayMs = Number(process.env.AGENTS_RECORDER_KEYSTROKE_DELAY_MS ?? '35');",
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
  const stepLabel = `${step.id}: ${step.type.toUpperCase()} ${step.label ?? step.route ?? ''}`.trim();
  const selectorArg = step.selector ? `, ${quote(step.selector)}` : '';
  const lines = [`  // ${stepLabel}`];

  if (step.type === 'visit') {
    lines.push(`  await page.goto(new URL(${quote(step.route ?? '/')}, baseUrl).toString());`);
    if (step.assertion?.startsWith('title contains ')) {
      const expected = step.assertion.match(/"([^"]+)"/)?.[1];
      if (expected) lines.push(`  await expect(page).toHaveTitle(/${escapeRegex(expected)}/);`);
    }
    lines.push(`  await showRecorderStep(page, ${quote(stepLabel)});`);
  }

  if (step.type === 'click') {
    lines.push(`  await showRecorderStep(page, ${quote(stepLabel)}${selectorArg});`);
    lines.push(`  await moveRecorderMouseTo(page, ${quote(step.selector)});`);
    lines.push(`  await focusRecorderTarget(page, ${quote(step.selector)});`);
    lines.push(`  await clickRecorderTarget(page, ${quote(step.selector)});`);
    lines.push('  await settleRecorderStep(page);');
  }

  if (step.type === 'fill') {
    lines.push(`  await showRecorderStep(page, ${quote(stepLabel)}${selectorArg});`);
    lines.push(`  await moveRecorderMouseTo(page, ${quote(step.selector)});`);
    lines.push(`  await focusRecorderTarget(page, ${quote(step.selector)});`);
    lines.push(`  await fillRecorderTarget(page, ${quote(step.selector)}, ${quote(step.value ?? '<value>')});`);
    lines.push('  await settleRecorderStep(page);');
  }

  if (step.type === 'assert') {
    lines.push(`  await showRecorderStep(page, ${quote(stepLabel)}${selectorArg});`);
    lines.push(`  await moveRecorderMouseTo(page, ${quote(step.selector)});`);
    lines.push(`  await focusRecorderTarget(page, ${quote(step.selector)});`);
    lines.push(`  await expect(page.locator(${quote(step.selector)})).toBeVisible();`);
    lines.push('  await settleRecorderStep(page);');
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

async function showRecorderStep(page, label, selector) {
  await page.evaluate(({ label, selector }) => {
    document.querySelectorAll('[data-agents-recorder-highlight]').forEach((element) => {
      element.style.outline = element.dataset.agentsRecorderOriginalOutline ?? '';
      element.style.boxShadow = element.dataset.agentsRecorderOriginalBoxShadow ?? '';
      element.removeAttribute('data-agents-recorder-highlight');
      delete element.dataset.agentsRecorderOriginalOutline;
      delete element.dataset.agentsRecorderOriginalBoxShadow;
    });

    let banner = document.querySelector('[data-agents-recorder-banner]');
    if (!banner) {
      banner = document.createElement('div');
      banner.setAttribute('data-agents-recorder-banner', 'true');
      Object.assign(banner.style, {
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '2147483647',
        padding: '12px 18px',
        borderRadius: '999px',
        background: 'rgba(15, 23, 42, 0.94)',
        color: '#fff',
        font: '700 16px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        letterSpacing: '0.01em',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.3)',
        pointerEvents: 'none'
      });
      document.body.appendChild(banner);
    }
    banner.textContent = label;

    if (!selector) return;

    let target;
    try {
      target = document.querySelector(selector);
    } catch {
      return;
    }

    if (!target) return;
    target.scrollIntoView({ block: 'center', inline: 'center' });
    target.dataset.agentsRecorderOriginalOutline = target.style.outline ?? '';
    target.dataset.agentsRecorderOriginalBoxShadow = target.style.boxShadow ?? '';
    target.setAttribute('data-agents-recorder-highlight', 'true');
    target.style.outline = '4px solid #f97316';
    target.style.boxShadow = '0 0 0 8px rgba(249, 115, 22, 0.28)';
  }, { label, selector });
  await page.waitForTimeout(recorderStepDelayMs);
}

async function moveRecorderMouseTo(page, selector) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return;

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(({ x, y, duration }) => {
    let cursor = document.querySelector('[data-agents-recorder-cursor]');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.setAttribute('data-agents-recorder-cursor', 'true');
      Object.assign(cursor.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '22px',
        height: '22px',
        borderRadius: '999px',
        background: 'rgba(59, 130, 246, 0.95)',
        border: '3px solid #fff',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
        pointerEvents: 'none',
        zIndex: '2147483647',
        transform: 'translate(24px, 24px) translate(-50%, -50%)'
      });
      document.body.appendChild(cursor);
    }

    cursor.style.transition = 'transform ' + duration + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
    cursor.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%, -50%)';
  }, { x, y, duration: recorderMouseMoveMs });
  await page.mouse.move(x, y, { steps: recorderMouseSteps });
  await page.waitForTimeout(recorderMouseMoveMs);
}

async function focusRecorderTarget(page, selector) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    const focusableTag = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/i.test(element.tagName);
    const focusable = focusableTag || element.hasAttribute('tabindex') || element.isContentEditable;
    if (!focusable) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
  });
  await page.waitForTimeout(Math.min(250, recorderStepDelayMs));
}

async function clickRecorderTarget(page, selector) {
  const locator = page.locator(selector).first();
  const box = await locator.boundingBox();
  if (!box) {
    await locator.click();
    return;
  }

  await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
}

async function fillRecorderTarget(page, selector, value) {
  const locator = page.locator(selector).first();
  await locator.fill('');
  await page.keyboard.type(value, { delay: recorderKeystrokeDelayMs });
}

async function settleRecorderStep(page) {
  await page.waitForTimeout(recorderStepDelayMs);
}

async function saveRequestedVideo(page) {
  const video = page.video();
  const requestedVideoPath = process.env.PLAYWRIGHT_VIDEO_PATH;
  if (!requestedVideoPath) return;
  if (!video) {
    throw new Error("PLAYWRIGHT_VIDEO_PATH was set but Playwright did not expose a page video. Keep test.use({ video: 'on' }) enabled or use an external recorder.");
  }

  const outputVideoPath = path.resolve(artifactDir, requestedVideoPath);
  await mkdir(path.dirname(outputVideoPath), { recursive: true });
  await page.close();

  if (requestedVideoPath.toLowerCase().endsWith('.mp4')) {
    const sourceVideoPath = outputVideoPath + '.source.webm';
    await video.saveAs(sourceVideoPath);
    try {
      await convertVideoToMp4(sourceVideoPath, outputVideoPath);
    } finally {
      await rm(sourceVideoPath, { force: true });
    }
    return;
  }

  await video.saveAs(outputVideoPath);
}

async function convertVideoToMp4(sourceVideoPath, outputVideoPath) {
  const ffmpegPath = process.env.FFMPEG_PATH ?? 'ffmpeg';
  await execFileAsync(ffmpegPath, [
    '-y',
    '-i', sourceVideoPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputVideoPath
  ]);
}
`;
}

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
