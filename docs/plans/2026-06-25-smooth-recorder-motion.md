# Smooth Recorder Motion Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make generated recorder videos show smooth pointer travel from one target node to the next while focusing each target before it is clicked, filled, or asserted.

**Architecture:** Keep the behavior in `src/playwright-generator.js` so every generated Playwright spec gets the same human-watchable motion primitives. Add source-level generator regressions first, then regenerate repo-local evidence in a new verification directory instead of overwriting prior video artifacts.

**Tech Stack:** Node.js test runner, Playwright generated scripts, repo-local verification artifacts.

---

### Task 1: Add RED regression for smooth pointer and focus primitives

**Objective:** Prove the current generated script lacks smooth recorder cursor movement and explicit focus transitions.

**Files:**
- Modify: `test/generators.test.js`

**Step 1: Write failing test**

Add a generator test asserting that `generatePlaywrightScript(flow)` includes:
- `moveRecorderMouseTo(page, selector)` before click/fill/assert actions.
- `focusRecorderTarget(page, selector)` before interactive actions.
- a visible `data-agents-recorder-cursor` overlay.
- `page.mouse.move(x, y, { steps: recorderMouseSteps })`.
- keyboard typing for fills instead of instantaneous value jumps.

**Step 2: Run test to verify failure**

Run: `node --test test/generators.test.js`
Expected: FAIL because current generator only highlights/waits and then uses direct locator click/fill.

### Task 2: Implement smooth motion helpers in generated specs

**Objective:** Emit helper functions that visually animate an in-page cursor and drive Playwright's mouse to the target center.

**Files:**
- Modify: `src/playwright-generator.js`

**Step 1: Write minimal implementation**

Add generated constants and helpers:
- `AGENTS_RECORDER_MOUSE_MOVE_MS` with a human-visible default.
- `AGENTS_RECORDER_KEYSTROKE_DELAY_MS` for fill typing.
- `moveRecorderMouseTo(page, selector)` that computes a target bounding box, animates a visible cursor overlay, and calls `page.mouse.move(...)` with steps.
- `focusRecorderTarget(page, selector)` that scrolls and focuses the target, adding temporary `tabindex="-1"` for non-focusable assertion targets.
- `clickRecorderTarget(page, selector)` and `fillRecorderTarget(page, selector, value)` wrappers.

**Step 2: Run focused test**

Run: `node --test test/generators.test.js`
Expected: PASS.

### Task 3: Regenerate smooth-motion evidence

**Objective:** Produce new repo-local evidence showing the updated generated script and video artifacts.

**Files:**
- Create/update: `docs/verification/smooth-motion-run/`
- Modify: `.hermes/checklists/recorder-track.md`
- Modify: `docs/verification/coverage-node-test.txt` if coverage output changes

**Step 1: Generate artifacts**

Run the CLI plan/generate/report flow against `test/fixtures/site` into `docs/verification/smooth-motion-run/`.

**Step 2: Run generated Playwright spec**

Run from the evidence directory:
`AGENTS_RECORDER_STEP_DELAY_MS=900 AGENTS_RECORDER_MOUSE_MOVE_MS=700 PLAYWRIGHT_VIDEO_PATH=playback.webm npx playwright test playwright.spec.js --output=recording --reporter=line`

**Step 3: Verify artifacts**

Run focused tests, full tests, coverage, `node --check`, `git diff --check`, `file`, and `wc -c` on the playback artifacts.

### Task 4: Commit, push, and update PR evidence

**Objective:** Leave the draft PR with a pushed follow-up commit and evidence comment.

**Files:**
- Stage only intended source, tests, plan, checklist, coverage, and smooth-motion evidence files.

**Step 1: Commit**

Commit message: `fix: smooth recorder mouse motion`

**Step 2: Push and update PR**

Push `feat/recorder-scaffold`, confirm PR #1 remains open/draft, and add a PR comment with verification evidence.
