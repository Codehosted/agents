import path from 'node:path';

export function buildRecorderCommand({ scriptPath, outputDir = 'artifacts/recording', videoPath = 'artifacts/playback.mp4' }) {
  const cwd = path.dirname(scriptPath);
  const commandSpec = {
    command: 'npx',
    args: [
      'playwright',
      'test',
      pathForCommand(cwd, scriptPath),
      `--output=${pathForCommand(cwd, outputDir)}`,
      '--reporter=line'
    ],
    env: { PLAYWRIGHT_VIDEO_PATH: pathForCommand(cwd, videoPath) },
    videoPath
  };

  if (cwd !== '.') commandSpec.cwd = cwd;
  return commandSpec;
}

export function recorderNotes(commandSpec) {
  const cwdNote = commandSpec.cwd ? `Working directory: ${commandSpec.cwd}` : 'Working directory: current directory';
  return [
    'Run Playwright in a separate process from planning/report generation.',
    cwdNote,
    `Command: ${commandSpec.command} ${commandSpec.args.join(' ')}`,
    `Expected video artifact: ${commandSpec.videoPath}`,
    'For MP4 output, install ffmpeg or set FFMPEG_PATH to a compatible ffmpeg binary.',
    'Use Playwright video configuration or an open-source screen recorder such as ffmpeg/xvfb for environments that need whole-desktop capture.'
  ].join('\n');
}

function pathForCommand(cwd, targetPath) {
  if (cwd === '.') return targetPath;
  return path.relative(cwd, targetPath) || path.basename(targetPath);
}
