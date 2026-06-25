import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

const baseUrl = 'http://localhost:4173';

test('story', async ({ page }) => {
  // step-01: VISIT Visit Recorder fixture
  await page.goto(new URL('/', baseUrl).toString());
  await expect(page).toHaveTitle(/Recorder fixture/);
  await saveStepScreenshot(page, 'screenshots/01-visit-home.png');

  // step-02: CLICK Pricing
  await page.locator('#pricing-link').click();
  await saveStepScreenshot(page, 'screenshots/02-click-pricing-link.png');

  // step-03: FILL Demo email
  await page.locator('[data-testid="demo-email"]').fill('george@example.com');
  await saveStepScreenshot(page, 'screenshots/03-fill-demo-email.png');

  // step-04: CLICK Start recorder demo
  await page.locator('#start-recorder-demo').click();
  await saveStepScreenshot(page, 'screenshots/04-click-start-recorder-demo.png');

  // step-05: ASSERT Demo Ready
  await expect(page.locator('#demo-ready')).toBeVisible();
  await saveStepScreenshot(page, 'screenshots/05-assert-demo-ready.png');

  await saveRequestedVideo(page);
});

async function saveStepScreenshot(page, screenshotPath) {
  await mkdir(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

async function saveRequestedVideo(page) {
  const video = page.video();
  if (!process.env.PLAYWRIGHT_VIDEO_PATH || !video) return;

  await mkdir(path.dirname(process.env.PLAYWRIGHT_VIDEO_PATH), { recursive: true });
  await page.close();
  await video.saveAs(process.env.PLAYWRIGHT_VIDEO_PATH);
}
