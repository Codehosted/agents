# Codehosted Agents Recorder

Local-first tooling for turning static page output plus a narrated user story into a flow diagram, generated Playwright script, separate recorder command, and Mixpanel-like local timeline report.

The project is intentionally open-source-friendly: it uses Node.js built-ins for parsing/planning/report generation and treats Playwright/video capture as local execution artifacts instead of requiring a proprietary analytics SDK.

## What it does today

- Parses static HTML pages from an exported site or fixture.
- Discovers links, buttons, inputs, labels, IDs, `data-testid` values, selectors, and route metadata.
- Maps a simple narrated story into visit/click/fill/assert steps.
- Emits:
  - `flow.json`
  - `flow.mmd`
  - `playwright.spec.js`
  - `timeline.html`
  - `recorder-command.json`
- Keeps recording separate from planning by producing a command spec for a Playwright recorder process that writes `PLAYWRIGHT_VIDEO_PATH`.

## Install / run locally

```bash
npm test
node bin/agents-recorder.js plan \
  --site test/fixtures/site \
  --story test/fixtures/story.md \
  --out artifacts/demo \
  --base-url http://localhost:4173
```

Inspect the generated artifacts:

```bash
open artifacts/demo/timeline.html
cat artifacts/demo/flow.mmd
cat artifacts/demo/playwright.spec.js
cat artifacts/demo/recorder-command.json
```

## CLI commands

### `plan`

Parse a static site and story, then write all planning artifacts.

```bash
agents-recorder plan --site ./out --story ./stories/signup.md --out ./artifacts/signup --base-url http://localhost:4173
```

### `generate`

Regenerate a Playwright script from an existing flow.

```bash
agents-recorder generate --flow ./artifacts/signup/flow.json --out ./artifacts/signup/playwright.spec.js
```

### `report`

Generate a standalone local timeline HTML report.

```bash
agents-recorder report --flow ./artifacts/signup/flow.json --out ./artifacts/signup/timeline.html --video playback.webm
```

### `record`

Print the separate recorder process command spec.

```bash
agents-recorder record --script ./artifacts/signup/playwright.spec.js --out ./artifacts/signup/recording --video ./artifacts/signup/playback.webm
```

## Project philosophy

1. **Parse first, drive browsers second.** Static output is quick to inspect and should produce a deterministic automation plan before browser execution starts.
2. **Selectors are first-class.** Flow steps preserve IDs, `data-testid` values, labels, screenshots, assertions, and button IDs so reviewers can audit generated automation.
3. **Recording is separate.** Planning/reporting should not block on long-running video capture. The recorder command can be run independently with Playwright video settings or open-source desktop capture tools such as `ffmpeg`/`xvfb` where needed.
4. **Reports stay local.** The generated `timeline.html` is a local Mixpanel-like event timeline with screenshots and video links, not a proprietary analytics dependency.

## Development

```bash
npm test
npm run coverage
```

The current scaffold uses `node:test` for unit coverage and `@playwright/test` as a dev-only dependency for generated browser playback/video verification.
