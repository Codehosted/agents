export function generateMermaid(flow) {
  const lines = ['flowchart TD'];

  for (const step of flow.steps ?? []) {
    lines.push(`  ${step.id}["${nodeLabel(step)}"]`);
  }

  for (let index = 0; index < (flow.steps ?? []).length - 1; index += 1) {
    lines.push(`  ${flow.steps[index].id} --> ${flow.steps[index + 1].id}`);
  }

  if (flow.artifacts?.video) {
    lines.push(`  video[["VIDEO: ${flow.artifacts.video}"]]`);
    const lastStep = flow.steps?.at(-1);
    if (lastStep) lines.push(`  ${lastStep.id} --> video`);
  }

  return `${lines.join('\n')}\n`;
}

function nodeLabel(step) {
  const primary = `${step.type.toUpperCase()}: ${step.label ?? step.route ?? step.id}`;
  const secondary = step.selector || step.assertion || step.screenshot;
  return escapeMermaidLabel(secondary ? `${primary}\\n${secondary}` : primary);
}

function escapeMermaidLabel(value) {
  return String(value).replace(/"/g, '\\"');
}
