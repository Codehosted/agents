import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtmlPage } from '../src/static-parser.js';

test('parseHtmlPage discovers titled page elements with stable selectors', () => {
  const html = `
    <html>
      <head><title>Recorder landing</title></head>
      <body>
        <h1>Open recorder demo</h1>
        <a id="pricing-link" href="/pricing">Pricing</a>
        <button id="start-recorder-demo">Start recorder demo</button>
        <input data-testid="demo-email" aria-label="Demo email" />
      </body>
    </html>
  `;

  const page = parseHtmlPage(html, { route: '/', filePath: 'index.html' });

  assert.equal(page.route, '/');
  assert.equal(page.title, 'Open recorder demo');
  assert.deepEqual(
    page.elements.map((element) => ({ kind: element.kind, label: element.label, selector: element.selector })),
    [
      { kind: 'link', label: 'Pricing', selector: '#pricing-link' },
      { kind: 'button', label: 'Start recorder demo', selector: '#start-recorder-demo' },
      { kind: 'input', label: 'Demo email', selector: '[data-testid="demo-email"]' }
    ]
  );
});
