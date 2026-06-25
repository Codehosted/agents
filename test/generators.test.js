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
  artifacts: { video: 'playback.mp4' }
};

test('generators include selectors screenshots and video artifacts', () => {
  const mermaid = generateMermaid(flow);
  const playwrightScript = generatePlaywrightScript(flow);
  const recorderCommand = buildRecorderCommand({ scriptPath: 'artifacts/playwright.spec.js', outputDir: 'artifacts/recording', videoPath: 'artifacts/playback.mp4' });
  const events = createTimelineEvents(flow);
  const timelineHtml = generateTimelineHtml(flow, { events, videoPath: 'playback.mp4' });

  assert.match(mermaid, /step-02\["CLICK: Pricing\\n#pricing-link"\]/);
  assert.match(mermaid, /playback\.mp4/);
  assert.match(playwrightScript, /test\.use\(\{ video: 'on' \}\);/);
  assert.match(playwrightScript, /PLAYWRIGHT_VIDEO_PATH/);
  assert.match(playwrightScript, /video\.saveAs\(process\.env\.PLAYWRIGHT_VIDEO_PATH\)/);
  assert.match(playwrightScript, /FFMPEG_PATH/);
  assert.match(playwrightScript, /PLAYWRIGHT_VIDEO_PATH was set but Playwright did not expose a page video/);
  assert.match(playwrightScript, /requestedVideoPath\.toLowerCase\(\)\.endsWith\('\.mp4'\)/);
  assert.match(playwrightScript, /video\.saveAs\(sourceVideoPath\)/);
  assert.match(playwrightScript, /libx264/);
  assert.match(playwrightScript, /await page\.locator\('#pricing-link'\)\.click\(\);/);
  assert.match(playwrightScript, /await page\.locator\('\[data-testid="demo-email"\]'\)\.fill\('george@example.com'\);/);
  assert.match(playwrightScript, /screenshots\/03-fill-demo-email\.png/);
  assert.match(playwrightScript, /fileURLToPath\(import\.meta\.url\)/);
  assert.match(playwrightScript, /path\.resolve\(artifactDir, screenshotPath\)/);
  assert.deepEqual(recorderCommand, {
    command: 'npx',
    cwd: 'artifacts',
    args: ['playwright', 'test', 'playwright.spec.js', '--output=recording', '--reporter=line'],
    env: { PLAYWRIGHT_VIDEO_PATH: 'playback.mp4' },
    videoPath: 'artifacts/playback.mp4'
  });
  assert.equal(events[1].selector, '#pricing-link');
  assert.match(timelineHtml, /<video[^>]+src="playback\.mp4"/);
  assert.match(timelineHtml, /#pricing-link/);
  assert.match(timelineHtml, /screenshots\/02-click-pricing-link\.png/);
});

test('generateTimelineHtml omits trailing whitespace-only lines', () => {
  const timelineHtml = generateTimelineHtml({
    name: 'minimal timeline',
    baseUrl: 'http://localhost:4173',
    steps: [
      { id: 'step-01', type: 'visit', route: '/', label: 'Home', assertion: 'title contains "Home"' }
    ],
    artifacts: { video: 'playback.webm' }
  });

  assert.equal(
    timelineHtml.split('\n').filter((line) => /\s+$/.test(line)).length,
    0
  );
});

test('generatePlaywrightScript escapes slashes in slash-delimited title regexes', () => {
  const script = generatePlaywrightScript({
    name: 'pricing title',
    baseUrl: 'http://localhost:4173',
    steps: [
      { id: 'step-01', type: 'visit', route: '/pricing', label: 'Visit pricing', assertion: 'title contains "Plans / Pricing"' }
    ]
  });

  assert.ok(script.includes('await expect(page).toHaveTitle(/Plans \\/ Pricing/);'));
  assert.doesNotMatch(script, /toHaveTitle\(\/Plans \/ Pricing\/\)/);
});

test('generatePlaywrightScript adds visible recorder step overlays and dwell timing', () => {
  const script = generatePlaywrightScript(flow);

  assert.match(script, /AGENTS_RECORDER_STEP_DELAY_MS/);
  assert.match(script, /await showRecorderStep\(page, 'step-02: CLICK Pricing', '#pricing-link'\);/);
  assert.match(script, /data-agents-recorder-highlight/);
  assert.match(script, /await page\.waitForTimeout\(recorderStepDelayMs\);/);
});
