# Codehosted Agents recorder design

## Scope

Build an open-source-friendly local tool that turns static site output plus a narrated user story into:

1. A flow diagram with pages, actions, assertions, and stable element/button IDs.
2. A generated Playwright script for execution.
3. A separate recording process that captures the automation playback to video.
4. A local Mixpanel-like timeline/report of events, screenshots, and artifacts.

## Why split static planning from browser execution

Static parsing is faster than immediately driving a headless browser. The tool should parse HTML/static output first, create an action graph, and only invoke Playwright for dynamic verification, screenshots, and video.

## Proposed package layout

- `packages/flow-recorder/src/static-parser.ts`: parse static HTML/routes and discover forms/buttons/links/IDs.
- `packages/flow-recorder/src/story-parser.ts`: convert narrated user stories into ordered intents.
- `packages/flow-recorder/src/flow-diagram.ts`: produce Mermaid/JSON flow diagrams.
- `packages/flow-recorder/src/playwright-generator.ts`: generate Playwright scripts with selectors and assertions.
- `packages/flow-recorder/src/recorder.ts`: spawn Playwright with video capture enabled as a separate process.
- `packages/flow-recorder/src/timeline.ts`: write a local event timeline/report with screenshots and video links.
- `examples/popz-site-choice/`: sample flow for Popz Pizza popup + tracker.

## CLI sketch

```bash
agents-recorder plan --site ./out --story stories/popz.md --out artifacts/popz-flow
agents-recorder generate --flow artifacts/popz-flow/flow.json --out artifacts/popz-flow/playwright.spec.ts
agents-recorder record --script artifacts/popz-flow/playwright.spec.ts --video artifacts/popz-flow/playback.webm
```

## Output artifacts

- `flow.json`
- `flow.mmd`
- `playwright.spec.ts`
- `timeline.html`
- `screenshots/*.png`
- `playback.webm`

## Acceptance criteria

- Static parser can discover page links, buttons, forms, IDs, and accessible labels.
- Story parser maps narration into ordered flow steps.
- Playwright generator creates deterministic scripts that run locally.
- Recorder runs separately so long recordings do not block the planner.
- Test coverage reaches at least 90% for parser/generator modules.
- Project is pushed under `Codehosted/agents` or the requested Codehosted agents repo.
