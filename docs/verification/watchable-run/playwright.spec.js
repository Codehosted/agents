import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const recorderStepDelayMs = Number(process.env.AGENTS_RECORDER_STEP_DELAY_MS ?? '900');
const baseUrl = 'http://localhost:4173';

test('story', async ({ page }) => {
  // step-01: VISIT Visit Recorder fixture
  await page.goto(new URL('/', baseUrl).toString());
  await expect(page).toHaveTitle(/Recorder fixture/);
  await showRecorderStep(page, 'step-01: VISIT Visit Recorder fixture');
  await saveStepScreenshot(page, 'screenshots/01-visit-home.png');

  // step-02: CLICK Pricing
  await showRecorderStep(page, 'step-02: CLICK Pricing', '#pricing-link');
  await page.locator('#pricing-link').click();
  await settleRecorderStep(page);
  await saveStepScreenshot(page, 'screenshots/02-click-pricing-link.png');

  // step-03: FILL Demo email
  await showRecorderStep(page, 'step-03: FILL Demo email', '[data-testid="demo-email"]');
  await page.locator('[data-testid="demo-email"]').fill('george@example.com');
  await settleRecorderStep(page);
  await saveStepScreenshot(page, 'screenshots/03-fill-demo-email.png');

  // step-04: CLICK Start recorder demo
  await showRecorderStep(page, 'step-04: CLICK Start recorder demo', '#start-recorder-demo');
  await page.locator('#start-recorder-demo').click();
  await settleRecorderStep(page);
  await saveStepScreenshot(page, 'screenshots/04-click-start-recorder-demo.png');

  // step-05: ASSERT Demo Ready
  await showRecorderStep(page, 'step-05: ASSERT Demo Ready', '#demo-ready');
  await expect(page.locator('#demo-ready')).toBeVisible();
  await settleRecorderStep(page);
  await saveStepScreenshot(page, 'screenshots/05-assert-demo-ready.png');

  await saveRequestedVideo(page);
});

async function saveStepScreenshot(page, screenshotPath) {
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

async function settleRecorderStep(page) {
  await page.waitForTimeout(recorderStepDelayMs);
}

async function saveRequestedVideo(page) {
  const video = page.video();
  if (!process.env.PLAYWRIGHT_VIDEO_PATH || !video) return;

  await mkdir(path.dirname(process.env.PLAYWRIGHT_VIDEO_PATH), { recursive: true });
  await page.close();
  await video.saveAs(process.env.PLAYWRIGHT_VIDEO_PATH);
}
