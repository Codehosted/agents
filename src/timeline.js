export function createTimelineEvents(flow) {
  return (flow.steps ?? []).map((step, index) => ({
    id: step.id,
    at: Number((index * 2.25).toFixed(3)),
    type: step.type,
    label: step.label,
    route: step.route,
    selector: step.selector,
    buttonId: step.buttonId,
    testId: step.testId,
    assertion: step.assertion,
    screenshot: step.screenshot,
    narration: step.narration
  }));
}

export function generateTimelineHtml(flow, { events = createTimelineEvents(flow), videoPath = flow.artifacts?.video ?? 'playback.mp4' } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(flow.name ?? 'Recorder timeline')}</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #07101d; color: #e5f0ff; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px; }
    .summary, .event, .artifact { border: 1px solid #24415f; background: #0e1a2c; border-radius: 18px; padding: 16px; margin: 14px 0; }
    code { color: #d8b4fe; background: #1e1b4b; padding: 3px 6px; border-radius: 7px; }
    img { width: 180px; max-width: 100%; border: 1px solid #24415f; border-radius: 12px; background: #0f172a; }
    video { width: 100%; max-height: 360px; border-radius: 18px; background: #020617; }
    .meta { color: #93a9c6; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(flow.name ?? 'Recorder timeline')}</h1>
    <section class="summary">
      <p class="meta">Local Mixpanel-like timeline generated without proprietary analytics.</p>
      <p><strong>Base URL:</strong> <code>${escapeHtml(flow.baseUrl ?? '')}</code></p>
      <p><strong>Events:</strong> ${events.length}</p>
    </section>
    <section class="artifact">
      <h2>Playback</h2>
      <video controls src="${escapeAttribute(videoPath)}"></video>
    </section>
    <section aria-label="Timeline events">
      ${events.map(renderEvent).join('\n')}
    </section>
  </main>
</body>
</html>
`;
}

function renderEvent(event) {
  const lines = [
    `<article class="event" id="${escapeAttribute(event.id)}">`,
    `  <p class="meta">+${event.at.toFixed(3)}s · ${escapeHtml(event.type.toUpperCase())} · ${escapeHtml(event.route ?? '')}</p>`,
    `  <h2>${escapeHtml(event.label ?? event.id)}</h2>`
  ];

  if (event.selector) lines.push(`  <p><strong>Selector:</strong> <code>${escapeHtml(event.selector)}</code></p>`);
  if (event.buttonId) lines.push(`  <p><strong>Button ID:</strong> <code>${escapeHtml(event.buttonId)}</code></p>`);
  if (event.testId) lines.push(`  <p><strong>Test ID:</strong> <code>${escapeHtml(event.testId)}</code></p>`);
  if (event.assertion) lines.push(`  <p><strong>Assertion:</strong> ${escapeHtml(event.assertion)}</p>`);
  if (event.narration) lines.push(`  <p><strong>Narration:</strong> ${escapeHtml(event.narration)}</p>`);
  if (event.screenshot) {
    lines.push(`  <p><strong>Screenshot:</strong> <code>${escapeHtml(event.screenshot)}</code></p><img src="${escapeAttribute(event.screenshot)}" alt="Screenshot for ${escapeAttribute(event.label ?? event.id)}" />`);
  }
  lines.push('</article>');

  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
