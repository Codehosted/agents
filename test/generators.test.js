import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMermaid } from '../src/flow-diagram.js';
import { generatePlaywrightScript } from '../src/playwright-generator.js';
import { buildRecorderCommand } from '../src/recorder.js';
import { createTimelineEvents, generateTimelineHtml } from '../src/timeline.js';

const flow = {
  name: 'narrated signup demo',
  baseUrl: 'http://localhost:4173',
  steps: [
    { id: 'step-01', type: 'visit', route: '/', label: 'Visit Recorder landing', assertion: 'title contains "Recorder landing"', screenshot: 'screenshots/01-visit-home.png' },
    { id: 'step-02', type: 'click', route: '/', label: 'Pricing', selector: '#pricing-link', buttonId: 'pricing-link', screenshot: 'screenshots/02-click-pricing-link.png' },
    { id: 'step-03', type: 'fill', route: '/', label: 'Demo email', selector: '[data-testid="demo-email"]', testId: 'demo-email', value: 'george@example.com', screenshot: 'screenshots/03-fill-demo-email.png' },
    { id: 'step-04', type: 'assert', route: '/', label: 'Demo ready', selector: '#demo-ready', assertion: 'element is visible', screenshot: 'screenshots/04-assert-demo-ready.png' }
  ],
  artifacts: { video: 'playback.webm' }
};

test('generators include selectors screenshots and video artifacts', () => {
  const mermaid = generateMermaid(flow);
  const playwrightScript = generatePlaywrightScript(flow);
  const recorderCommand = buildRecorderCommand({ scriptPath: 'artifacts/playwright.spec.js', outputDir: 'artifacts/recording', videoPath: 'artifacts/playback.webm' });
  const events = createTimelineEvents(flow);
  const timelineHtml = generateTimelineHtml(flow, { events, videoPath: 'playback.webm' });

  assert.match(mermaid, /step-02\["CLICK: Pricing\\n#pricing-link"\]/);
  assert.match(mermaid, /playback\.webm/);
  assert.match(playwrightScript, /await page\.locator\('#pricing-link'\)\.click\(\);/);
  assert.match(playwrightScript, /await page\.locator\('\[data-testid="demo-email"\]'\)\.fill\('george@example.com'\);/);
  assert.match(playwrightScript, /screenshots\/03-fill-demo-email\.png/);
  assert.deepEqual(recorderCommand, {
    command: 'npx',
    args: ['playwright', 'test', 'artifacts/playwright.spec.js', '--project=chromium', '--output=artifacts/recording'],
    env: { PLAYWRIGHT_VIDEO_PATH: 'artifacts/playback.webm' },
    videoPath: 'artifacts/playback.webm'
  });
  assert.equal(events[1].selector, '#pricing-link');
  assert.match(timelineHtml, /<video[^>]+src="playback\.webm"/);
  assert.match(timelineHtml, /#pricing-link/);
  assert.match(timelineHtml, /screenshots\/02-click-pricing-link\.png/);
});
