# Recorder Video Proof and Coverage Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Raise recorder-specific test coverage and add actual video proof for the static example page.

**Architecture:** Keep planning/report generation dependency-light, but make generated Playwright scripts capable of saving a video to `PLAYWRIGHT_VIDEO_PATH` when a separate recorder process runs them. Use the existing `record` command as the separate-process contract and preserve repo-local verification artifacts under `docs/verification/sample-run/`.

**Tech Stack:** Node.js `node:test`, Playwright CLI for local visual proof, HTML fixture pages, local checklist evidence.

---

### Task 1: Add RED tests for generated video capture

**Objective:** Prove generated Playwright scripts currently do not configure or save video artifacts.

**Files:**
- Modify: `test/generators.test.js`
- Test: `test/generators.test.js`

**Step 1: Write failing test assertions**

Add assertions that `generatePlaywrightScript(flow)` includes:

```js
assert.match(playwrightScript, /test\.use\(\{ video: 'on' \}\);/);
assert.match(playwrightScript, /PLAYWRIGHT_VIDEO_PATH/);
assert.match(playwrightScript, /video\.saveAs\(process\.env\.PLAYWRIGHT_VIDEO_PATH\)/);
```

**Step 2: Run test to verify failure**

Run: `node --test test/generators.test.js`
Expected: FAIL because video recording hooks are missing.

**Step 3: Implement minimal generator support**

Modify `src/playwright-generator.js` so generated scripts:

```js
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

test.use({ video: 'on' });
```

At the end of each test, before closing:

```js
const video = page.video();
if (process.env.PLAYWRIGHT_VIDEO_PATH && video) {
  await mkdir(path.dirname(process.env.PLAYWRIGHT_VIDEO_PATH), { recursive: true });
  await page.close();
  await video.saveAs(process.env.PLAYWRIGHT_VIDEO_PATH);
}
```

**Step 4: Run test to verify pass**

Run: `node --test test/generators.test.js`
Expected: PASS.

**Step 5: Commit later with the full verified proof bundle**

Do not commit until sample video proof and coverage are regenerated.

### Task 2: Add RED tests for recorder module coverage

**Objective:** Cover recorder notes and command details so `src/recorder.js` is no longer materially under-covered.

**Files:**
- Create: `test/recorder.test.js`
- Test: `test/recorder.test.js`

**Step 1: Write failing/import-level test if needed**

Add focused coverage for `buildRecorderCommand` and `recorderNotes`:

```js
const commandSpec = buildRecorderCommand({
  scriptPath: 'docs/verification/sample-run/playwright.spec.js',
  outputDir: 'docs/verification/sample-run/recording',
  videoPath: 'docs/verification/sample-run/playback.webm'
});
const notes = recorderNotes(commandSpec);
assert.match(notes, /separate process/i);
assert.match(notes, /docs\/verification\/sample-run\/playback\.webm/);
```

**Step 2: Run test**

Run: `node --test test/recorder.test.js`
Expected: PASS if existing code already satisfies it, otherwise fix minimally.

### Task 3: Make the fixture runnable for video proof

**Objective:** Ensure the generated example script can run against the fixture without navigating away from elements needed later in the flow.

**Files:**
- Modify: `test/fixtures/site/index.html`

**Step 1: Adjust the fixture link**

Use same-page pricing navigation:

```html
<a id="pricing-link" href="#pricing">Pricing</a>
<section id="pricing">...</section>
```

**Step 2: Regenerate sample artifacts**

Run:

```bash
rm -rf docs/verification/sample-run
node bin/agents-recorder.js plan \
  --site test/fixtures/site \
  --story test/fixtures/story.md \
  --out docs/verification/sample-run \
  --base-url http://localhost:4173
```

Expected: fresh `flow.json`, `flow.mmd`, `playwright.spec.js`, `timeline.html`, `recorder-command.json`.

### Task 4: Produce actual video proof

**Objective:** Generate a real `.webm` playback artifact from the example page.

**Files:**
- Create: `docs/verification/sample-run/playback.webm`
- Create/update: `docs/verification/sample-run/screenshots/*.png`
- Update: `docs/verification/sample-run/timeline.html`
- Update: `.hermes/checklists/recorder-track.md`

**Step 1: Install or use local Playwright package as needed**

Run: `npm install --save-dev @playwright/test`

**Step 2: Start static server**

Run in background: `python3 -m http.server 4173 --directory test/fixtures/site`

**Step 3: Run separate recorder process**

Run from `docs/verification/sample-run`:

```bash
PLAYWRIGHT_VIDEO_PATH=playback.webm npx playwright test playwright.spec.js --output=recording --reporter=line
```

Expected: PASS and `docs/verification/sample-run/playback.webm` exists with non-zero bytes.

**Step 4: Verify video artifact**

Run:

```bash
file docs/verification/sample-run/playback.webm
python3 - <<'PY'
from pathlib import Path
p = Path('docs/verification/sample-run/playback.webm')
print(p.stat().st_size)
assert p.stat().st_size > 1000
PY
```

Expected: WebM media and non-trivial byte size.

### Task 5: Verify coverage and push

**Objective:** Update evidence and leave GitHub progress pushed.

**Files:**
- Update: `docs/verification/coverage-node-test.txt`
- Update: `.hermes/checklists/recorder-track.md`
- Update: `README.md` if command docs changed
- Commit/push intended files only

**Step 1: Run tests and coverage**

Run:

```bash
npm test
npm run coverage | tee docs/verification/coverage-node-test.txt
```

Expected: tests pass, recorder coverage improved, total coverage remains above 90%.

**Step 2: Check diff and commit**

Run:

```bash
git status --short
git diff --check
git add <intended files only>
git commit -m "test: add recorder video proof coverage"
git push
```

**Step 3: Update PR body if available**

Run:

```bash
gh pr view --json number,url,title,state,isDraft,headRefName,baseRefName
```

Update PR evidence if needed.
