import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtmlPage } from '../src/static-parser.js';
import { createFlow } from '../src/flow-model.js';

test('createFlow maps story instructions to selector-rich actions and assertions', () => {
  const page = parseHtmlPage(`
    <h1>Recorder landing</h1>
    <a id="pricing-link" href="/pricing">Pricing</a>
    <input data-testid="demo-email" aria-label="Demo email" />
    <button id="start-recorder-demo">Start recorder demo</button>
    <section id="demo-ready">Demo ready</section>
  `, { route: '/' });

  const flow = createFlow({
    name: 'narrated signup demo',
    site: { pages: [page] },
    story: 'Open the landing page. Click pricing. Fill demo email with george@example.com. Click start recorder demo. Confirm demo ready.',
    baseUrl: 'http://localhost:4173'
  });

  assert.equal(flow.name, 'narrated signup demo');
  assert.equal(flow.baseUrl, 'http://localhost:4173');
  assert.deepEqual(
    flow.steps.map((step) => ({ type: step.type, selector: step.selector, assertion: step.assertion })),
    [
      { type: 'visit', selector: undefined, assertion: 'title contains "Recorder landing"' },
      { type: 'click', selector: '#pricing-link', assertion: undefined },
      { type: 'fill', selector: '[data-testid="demo-email"]', assertion: undefined },
      { type: 'click', selector: '#start-recorder-demo', assertion: undefined },
      { type: 'assert', selector: '#demo-ready', assertion: 'element is visible' }
    ]
  );
  assert.deepEqual(flow.steps.map((step) => step.screenshot), [
    'screenshots/01-visit-home.png',
    'screenshots/02-click-pricing-link.png',
    'screenshots/03-fill-demo-email.png',
    'screenshots/04-click-start-recorder-demo.png',
    'screenshots/05-assert-demo-ready.png'
  ]);
});

test('createFlow keeps dotted fill values intact from narrated stories', () => {
  const page = parseHtmlPage('<h1>Recorder</h1><input data-testid="demo-email" aria-label="Demo email" />', { route: '/' });

  const flow = createFlow({
    site: { pages: [page] },
    story: 'Fill demo email with george@example.com.',
    baseUrl: 'http://localhost:4173'
  });

  assert.equal(flow.steps.find((step) => step.type === 'fill').value, 'george@example.com');
});

test('createFlow prefers the home route for the initial visit when static files sort differently', () => {
  const notFoundPage = parseHtmlPage('<h1>Not found</h1><button id="lost">Lost</button>', { route: '/404' });
  const homePage = parseHtmlPage('<h1>Recorder landing</h1><button id="start-recorder-demo">Start recorder demo</button>', { route: '/' });

  const flow = createFlow({
    site: { pages: [notFoundPage, homePage] },
    story: 'Open the landing page. Click start recorder demo.'
  });

  assert.equal(flow.steps[0].type, 'visit');
  assert.equal(flow.steps[0].route, '/');
  assert.equal(flow.steps[0].assertion, 'title contains "Recorder landing"');
});
