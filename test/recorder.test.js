import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecorderCommand, recorderNotes } from '../src/recorder.js';

test('recorder command and notes name the separate video recorder process', () => {
  const commandSpec = buildRecorderCommand({
    scriptPath: 'docs/verification/sample-run/playwright.spec.js',
    outputDir: 'docs/verification/sample-run/recording',
    videoPath: 'docs/verification/sample-run/playback.webm'
  });

  const notes = recorderNotes(commandSpec);

  assert.deepEqual(commandSpec, {
    command: 'npx',
    cwd: 'docs/verification/sample-run',
    args: [
      'playwright',
      'test',
      'playwright.spec.js',
      '--output=recording',
      '--reporter=line'
    ],
    env: { PLAYWRIGHT_VIDEO_PATH: 'playback.webm' },
    videoPath: 'docs/verification/sample-run/playback.webm'
  });
  assert.match(notes, /separate process/i);
  assert.match(notes, /docs\/verification\/sample-run\/playback\.webm/);
  assert.match(notes, /open-source screen recorder/);
});
