import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:4173';

test('story', async ({ page }) => {
  // step-01: VISIT Visit Recorder fixture
  await page.goto(new URL('/', baseUrl).toString());
  await expect(page).toHaveTitle(/Recorder fixture/);
  await page.screenshot({ path: 'screenshots/01-visit-home.png', fullPage: true });

  // step-02: CLICK Pricing
  await page.locator('#pricing-link').click();
  await page.screenshot({ path: 'screenshots/02-click-pricing-link.png', fullPage: true });

  // step-03: FILL Demo email
  await page.locator('[data-testid="demo-email"]').fill('george@example.com');
  await page.screenshot({ path: 'screenshots/03-fill-demo-email.png', fullPage: true });

  // step-04: CLICK Start recorder demo
  await page.locator('#start-recorder-demo').click();
  await page.screenshot({ path: 'screenshots/04-click-start-recorder-demo.png', fullPage: true });

  // step-05: ASSERT Demo Ready
  await expect(page.locator('#demo-ready')).toBeVisible();
  await page.screenshot({ path: 'screenshots/05-assert-demo-ready.png', fullPage: true });

});
