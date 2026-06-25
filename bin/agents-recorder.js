#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildRecorderCommand,
  createFlow,
  createTimelineEvents,
  generateMermaid,
  generatePlaywrightScript,
  generateTimelineHtml,
  parseStaticSite,
  recorderNotes
} from '../src/index.js';

async function main(argv) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);

  if (!command || args.help) {
    printHelp();
    return;
  }

  if (command === 'plan') return planCommand(args);
  if (command === 'generate') return generateCommand(args);
  if (command === 'report') return reportCommand(args);
  if (command === 'record') return recordCommand(args);

  throw new Error(`Unknown command: ${command}`);
}

async function planCommand(args) {
  const siteDir = required(args, 'site');
  const storyPath = required(args, 'story');
  const outputDir = required(args, 'out');
  const baseUrl = args['base-url'] ?? 'http://localhost:3000';
  const story = await readFile(storyPath, 'utf8');
  const site = parseStaticSite(siteDir);
  const flow = createFlow({ name: path.basename(storyPath, path.extname(storyPath)), site, story, baseUrl });

  await mkdir(path.join(outputDir, 'screenshots'), { recursive: true });
  await writeArtifacts(outputDir, flow);
  console.log(`Wrote flow artifacts to ${outputDir}`);
}

async function generateCommand(args) {
  const flowPath = required(args, 'flow');
  const outputPath = required(args, 'out');
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generatePlaywrightScript(flow));
  console.log(`Wrote Playwright script to ${outputPath}`);
}

async function reportCommand(args) {
  const flowPath = required(args, 'flow');
  const outputPath = required(args, 'out');
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const videoPath = args.video ?? flow.artifacts?.video ?? 'playback.webm';
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generateTimelineHtml(flow, { events: createTimelineEvents(flow), videoPath }));
  console.log(`Wrote timeline report to ${outputPath}`);
}

async function recordCommand(args) {
  const scriptPath = required(args, 'script');
  const outputDir = args.out ?? 'artifacts/recording';
  const videoPath = args.video ?? 'artifacts/playback.webm';
  const commandSpec = buildRecorderCommand({ scriptPath, outputDir, videoPath });
  console.log(JSON.stringify({ ...commandSpec, notes: recorderNotes(commandSpec) }, null, 2));
}

async function writeArtifacts(outputDir, flow) {
  const scriptPath = path.join(outputDir, 'playwright.spec.js');
  const videoPath = path.join(outputDir, flow.artifacts.video);
  const recorderCommand = buildRecorderCommand({
    scriptPath,
    outputDir: path.join(outputDir, 'recording'),
    videoPath
  });

  await Promise.all([
    writeFile(path.join(outputDir, 'flow.json'), `${JSON.stringify(flow, null, 2)}\n`),
    writeFile(path.join(outputDir, 'flow.mmd'), generateMermaid(flow)),
    writeFile(scriptPath, generatePlaywrightScript(flow)),
    writeFile(path.join(outputDir, 'timeline.html'), generateTimelineHtml(flow, { events: createTimelineEvents(flow), videoPath: flow.artifacts.video })),
    writeFile(path.join(outputDir, 'recorder-command.json'), `${JSON.stringify(recorderCommand, null, 2)}\n`)
  ]);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function required(args, key) {
  if (!args[key]) throw new Error(`Missing required --${key}`);
  return args[key];
}

function printHelp() {
  console.log(`agents-recorder

Usage:
  agents-recorder plan --site ./out --story ./stories/demo.md --out ./artifacts/demo --base-url http://localhost:4173
  agents-recorder generate --flow ./artifacts/demo/flow.json --out ./artifacts/demo/playwright.spec.js
  agents-recorder report --flow ./artifacts/demo/flow.json --out ./artifacts/demo/timeline.html --video playback.webm
  agents-recorder record --script ./artifacts/demo/playwright.spec.js --out ./artifacts/demo/recording --video ./artifacts/demo/playback.webm
`);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
