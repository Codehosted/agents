# Recorder PR Feedback Fixes Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Address PR review feedback for initial route selection, screenshot artifact paths, and slash-safe generated title regexes.

**Architecture:** Keep the existing dependency-light Node.js recorder package. Lock each PR comment with a focused regression test before changing implementation, then regenerate sample artifacts so reviewers can inspect the corrected generated script.

**Tech Stack:** Node.js `node:test`, existing static parser/flow model/generator modules, GitHub draft PR #1.

---

### Task 1: Add RED test for home-page first visit

**Objective:** Prove flows prefer `/`/home for the initial visit even when sorted static files put another route first.

**Files:**
- Modify: `test/flow-model.test.js`
- Test: `test/flow-model.test.js`

**Step 1: Write failing test**

Add a test where `site.pages` is `[/404, /]` and the narrated story says to open the landing page.

**Step 2: Run test to verify failure**

Run: `node --test test/flow-model.test.js`
Expected: FAIL because the first visit route is `/404`.

**Step 3: Write minimal implementation**

Select the primary page by preferring route `/`, then `/index`, then labels/titles that look like home/landing, falling back to the first page.

**Step 4: Run focused test to verify pass**

Run: `node --test test/flow-model.test.js`
Expected: PASS.

### Task 2: Add RED generator tests for artifact-relative screenshots and slash-safe title regexes

**Objective:** Prove generated Playwright specs are syntactically safe for titles with `/` and write screenshots beside the generated spec/report artifacts.

**Files:**
- Modify: `test/generators.test.js`
- Test: `test/generators.test.js`

**Step 1: Write failing tests**

Add assertions that generated scripts include `fileURLToPath(import.meta.url)`-based artifact directory resolution and emit `toHaveTitle(/Plans \/ Pricing/)` for a title assertion of `Plans / Pricing`.

**Step 2: Run test to verify failure**

Run: `node --test test/generators.test.js`
Expected: FAIL because screenshot paths are cwd-relative and `/` is not escaped for regex literals.

**Step 3: Write minimal implementation**

Update `src/playwright-generator.js` to anchor screenshot paths to the generated spec directory and escape `/` in regex literals.

**Step 4: Run focused test to verify pass**

Run: `node --test test/generators.test.js`
Expected: PASS.

### Task 3: Regenerate artifacts, verify, push, and update PR

**Objective:** Leave the draft PR branch with reviewable evidence and no stale generated sample spec.

**Files:**
- Update: `docs/verification/sample-run/playwright.spec.js`
- Update if regenerated output changes: `docs/verification/sample-run/flow.json`, `flow.mmd`, `timeline.html`, `recorder-command.json`
- Commit intended source/test/docs artifacts only.

**Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass.

**Step 2: Run coverage and diff checks**

Run: `npm run coverage` and `git diff --check`
Expected: coverage remains above 90%; no whitespace errors.

**Step 3: Commit and push**

Run: `git add <intended files> && git commit -m "fix: address recorder PR feedback" && git push`
Expected: branch `feat/recorder-scaffold` is pushed to PR #1.

**Step 4: Update PR evidence**

Comment or update PR body with the fixes, tests, branch, and commit SHA.
