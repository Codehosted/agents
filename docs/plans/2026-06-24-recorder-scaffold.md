# Recorder Scaffold Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the initial local/open-source recorder package scaffold for parsing static page output plus a narrated story into a flow model, generated Playwright script, recorder command, and local timeline report.

**Architecture:** Use dependency-light Node.js ESM modules so the project works locally without proprietary services. Parse static HTML fixtures into page/element metadata, normalize that metadata into a flow graph, generate Mermaid/Playwright/report artifacts, and expose everything through a small CLI.

**Tech Stack:** Node.js 20+, built-in `node:test`, ESM JavaScript, optional downstream Playwright execution.

---

### Task 1: Add static parser behavior

**Objective:** Parse exported/static HTML and discover page metadata, buttons, links, forms, selectors, labels, and screenshot placeholders.

**Files:**
- Create: `package.json`
- Create: `src/static-parser.js`
- Test: `test/static-parser.test.js`

**Step 1: Write failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHtmlPage } from '../src/static-parser.js';

test('parseHtmlPage discovers titled page elements with stable selectors', () => {
  const page = parseHtmlPage('<h1>Recorder</h1><button id="start-demo">Start demo</button>', { route: '/' });
  assert.equal(page.title, 'Recorder');
  assert.deepEqual(page.elements[0].selector, '#start-demo');
});
```

**Step 2: Run test to verify failure**

Run: `npm test -- --test-name-pattern "parseHtmlPage discovers"`
Expected: FAIL because `src/static-parser.js` does not exist yet.

**Step 3: Write minimal implementation**

Implement parser helpers in `src/static-parser.js` with no external dependencies.

**Step 4: Run test to verify pass**

Run: `npm test -- --test-name-pattern "parseHtmlPage discovers"`
Expected: PASS

---

### Task 2: Add flow model behavior

**Objective:** Convert parsed pages and story text into a deterministic flow with visits, actions, assertions, selectors/button IDs, screenshots, and narration.

**Files:**
- Create: `src/flow-model.js`
- Test: `test/flow-model.test.js`

**Step 1: Write failing test**

Assert `createFlow` emits a visit step, click/fill/assert steps, screenshot paths, and source selectors.

**Step 2: Run test to verify failure**

Run: `npm test -- --test-name-pattern "createFlow"`
Expected: FAIL because `src/flow-model.js` does not exist yet.

**Step 3: Write minimal implementation**

Implement story-line matching against parsed elements by label/id/test ID, then add fallback assertions.

**Step 4: Run test to verify pass**

Run: `npm test -- --test-name-pattern "createFlow"`
Expected: PASS

---

### Task 3: Add generator/report/recorder behavior

**Objective:** Generate Mermaid, Playwright script, recorder command, and local timeline HTML from the flow.

**Files:**
- Create: `src/flow-diagram.js`
- Create: `src/playwright-generator.js`
- Create: `src/recorder.js`
- Create: `src/timeline.js`
- Test: `test/generators.test.js`

**Step 1: Write failing tests**

Assert generators include selectors/button IDs, screenshot references, video slot, and a separate recorder command.

**Step 2: Run tests to verify failure**

Run: `npm test -- --test-name-pattern "generates"`
Expected: FAIL because generator modules do not exist yet.

**Step 3: Write minimal implementation**

Implement string generators and a documented recorder command builder.

**Step 4: Run tests to verify pass**

Run: `npm test -- --test-name-pattern "generates"`
Expected: PASS

---

### Task 4: Add CLI and README

**Objective:** Expose `plan`, `generate`, `report`, and `record` commands and document the local-first philosophy.

**Files:**
- Create: `bin/agents-recorder.js`
- Create: `src/index.js`
- Create: `README.md`
- Test: `test/cli.test.js`

**Step 1: Write failing CLI test**

Invoke `node bin/agents-recorder.js plan --site test/fixtures/site --story test/fixtures/story.md --out .tmp/flow` and assert it writes `flow.json`, `flow.mmd`, `playwright.spec.js`, and `timeline.html`.

**Step 2: Run test to verify failure**

Run: `npm test -- --test-name-pattern "CLI plan"`
Expected: FAIL because CLI does not exist yet.

**Step 3: Write minimal implementation**

Implement manual argument parsing and file writes.

**Step 4: Run test to verify pass**

Run: `npm test -- --test-name-pattern "CLI plan"`
Expected: PASS

---

### Task 5: Verify the implementation gate

**Objective:** Prove the scaffold works and patch the checklist.

**Files:**
- Modify: `.hermes/checklists/recorder-track.md`

**Step 1: Run focused and full tests**

Run: `npm test`
Expected: all tests pass.

**Step 2: Patch checklist**

Add evidence paths for package/CLI, parser, flow model, generators, recorder, timeline, README, and passing command output.
