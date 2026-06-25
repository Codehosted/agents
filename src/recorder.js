export function buildRecorderCommand({ scriptPath, outputDir = 'artifacts/recording', videoPath = 'artifacts/playback.webm' }) {
  return {
    command: 'npx',
    args: ['playwright', 'test', scriptPath, `--output=${outputDir}`],
    env: { PLAYWRIGHT_VIDEO_PATH: videoPath },
    videoPath
  };
}

export function recorderNotes(commandSpec) {
  return [
    'Run Playwright in a separate process from planning/report generation.',
    `Command: ${commandSpec.command} ${commandSpec.args.join(' ')}`,
    `Expected video artifact: ${commandSpec.videoPath}`,
    'Use Playwright video configuration or an open-source screen recorder such as ffmpeg/xvfb for environments that need whole-desktop capture.'
  ].join('\n');
}
