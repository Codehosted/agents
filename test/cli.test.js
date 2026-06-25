import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('CLI plan writes flow diagram script timeline and recorder command artifacts', async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'agents-recorder-'));

  try {
    const { stdout } = await execFileAsync(process.execPath, [
      'bin/agents-recorder.js',
      'plan',
      '--site',
      'test/fixtures/site',
      '--story',
      'test/fixtures/story.md',
      '--out',
      outputDir,
      '--base-url',
      'http://localhost:4173'
    ]);

    assert.match(stdout, /Wrote flow artifacts/);
    const flow = JSON.parse(await readFile(path.join(outputDir, 'flow.json'), 'utf8'));
    const mermaid = await readFile(path.join(outputDir, 'flow.mmd'), 'utf8');
    const script = await readFile(path.join(outputDir, 'playwright.spec.js'), 'utf8');
    const timeline = await readFile(path.join(outputDir, 'timeline.html'), 'utf8');
    const recorder = JSON.parse(await readFile(path.join(outputDir, 'recorder-command.json'), 'utf8'));

    assert.equal(flow.steps.length, 5);
    assert.match(mermaid, /#start-recorder-demo/);
    assert.match(script, /page\.locator\('#pricing-link'\)\.click/);
    assert.match(timeline, /playback\.webm/);
    assert.equal(recorder.command, 'npx');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
