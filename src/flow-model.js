export function createFlow({ name = 'recorder flow', site, story = '', baseUrl = 'http://localhost:3000' }) {
  const pages = site?.pages ?? [];
  const primaryPage = primaryPageFor(pages);
  const matchedSteps = matchStorySteps(story, pages, primaryPage.route);
  const steps = [visitStep(primaryPage), ...matchedSteps].map((step, index) => ({
    id: `step-${String(index + 1).padStart(2, '0')}`,
    screenshot: screenshotFor(index + 1, step),
    ...step
  }));

  return {
    schemaVersion: 1,
    name,
    baseUrl,
    pages: pages.map((page) => ({
      route: page.route,
      title: page.title,
      screenshot: page.screenshot,
      elements: page.elements
    })),
    steps,
    artifacts: {
      flowJson: 'flow.json',
      flowDiagram: 'flow.mmd',
      playwrightScript: 'playwright.spec.js',
      timelineReport: 'timeline.html',
      video: 'playback.webm'
    }
  };
}

function primaryPageFor(pages) {
  return pages.find((page) => page.route === '/' || page.route === '/index') ??
    pages.find((page) => /\b(home|landing|index)\b/i.test(`${page.title ?? ''} ${page.filePath ?? ''} ${page.route ?? ''}`)) ??
    pages[0] ??
    { route: '/', title: 'Untitled page', elements: [] };
}

function visitStep(page) {
  return {
    type: 'visit',
    route: page.route,
    label: `Visit ${page.title}`,
    assertion: `title contains "${page.title}"`,
    narration: `Open ${page.route}`
  };
}

function matchStorySteps(story, pages, fallbackRoute) {
  const elements = pages.flatMap((page) => page.elements.map((element) => ({ ...element, route: page.route })));
  const sentences = splitStory(story);

  return sentences.flatMap((sentence) => {
    const lower = sentence.toLowerCase();
    if (isVisitSentence(lower)) return [];
    if (isFillSentence(lower)) {
      const element = bestElementFor(sentence, elements, ['input', 'textarea', 'select']);
      return element ? [actionStep('fill', sentence, element, extractFillValue(sentence))] : [];
    }
    if (isClickSentence(lower)) {
      const element = bestElementFor(sentence, elements, ['button', 'link']);
      return element ? [actionStep('click', sentence, element)] : [];
    }
    if (isAssertSentence(lower)) {
      const element = bestElementFor(sentence, elements, undefined, 2) ?? assertionFallback(sentence, fallbackRoute ?? '/');
      return element ? [assertStep(sentence, element)] : [];
    }
    return [];
  });
}

function actionStep(type, sentence, element, value) {
  return {
    type,
    route: element.route,
    label: element.label,
    selector: element.selector,
    elementKind: element.kind,
    buttonId: element.id,
    testId: element.testId,
    value,
    narration: sentence
  };
}

function assertStep(sentence, element) {
  return {
    type: 'assert',
    route: element.route,
    label: element.label,
    selector: element.selector,
    assertion: 'element is visible',
    elementKind: element.kind,
    buttonId: element.id,
    testId: element.testId,
    narration: sentence
  };
}

function assertionFallback(sentence, route) {
  const label = sentence
    .replace(/^(confirm|verify|assert|see|expect)\s+/i, '')
    .replace(/[.?!]+$/g, '')
    .trim();
  if (!label) return undefined;
  const id = slug(label);
  return {
    id,
    kind: 'region',
    label: titleCase(label),
    route,
    selector: `#${id}`
  };
}

function splitStory(story) {
  const input = String(story);
  const sentences = [];
  let start = 0;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if ((character === '.' || character === '!' || character === '?' || character === '\n') && (!next || /\s/.test(next))) {
      sentences.push(input.slice(start, index + 1).trim());
      start = index + 1;
    }
  }

  const remainder = input.slice(start).trim();
  if (remainder) sentences.push(remainder);
  return sentences.filter(Boolean);
}

function isVisitSentence(sentence) {
  return /\b(open|visit|load|go to)\b/.test(sentence) && /\b(page|landing|route|site|home)\b/.test(sentence);
}

function isClickSentence(sentence) {
  return /\b(click|press|tap|open|choose|select)\b/.test(sentence);
}

function isFillSentence(sentence) {
  return /\b(fill|type|enter|input)\b/.test(sentence);
}

function isAssertSentence(sentence) {
  return /\b(confirm|verify|assert|see|expect|ensure)\b/.test(sentence);
}

function bestElementFor(sentence, elements, allowedKinds, minimumScore = 1) {
  const candidates = allowedKinds ? elements.filter((element) => allowedKinds.includes(element.kind)) : elements;
  const scored = candidates
    .map((element) => ({ element, score: scoreElement(sentence, element) }))
    .filter(({ score }) => score >= minimumScore)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.element;
}

function scoreElement(sentence, element) {
  const haystack = sentence.toLowerCase();
  const terms = [element.label, element.id, element.testId, element.name]
    .filter(Boolean)
    .flatMap((value) => tokenize(value));
  const uniqueTerms = [...new Set(terms)];
  return uniqueTerms.filter((term) => haystack.includes(term)).length;
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function extractFillValue(sentence) {
  const match = sentence.match(/\bwith\s+(.+)$/i);
  return match ? match[1].trim().replace(/[.?!]+$/g, '') : '<value>';
}

function screenshotFor(stepNumber, step) {
  const routeSlug = step.route === '/' ? 'home' : slug(step.route.replace(/^\//, ''));
  const subject = step.selector ? slug(step.selector.replace(/^#/, '').replace(/^\[data-testid="(.+)"\]$/, '$1')) : routeSlug;
  return `screenshots/${String(stepNumber).padStart(2, '0')}-${step.type}-${subject}.png`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}
