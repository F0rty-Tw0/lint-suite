import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  BENCHMARK_FILES_PER_PROJECT,
  BENCHMARK_PROJECT_COUNT
} from '../common/modular-boundaries.const.ts';

const projectName = (index: number): string => {
  return `@bench/p${index}`;
};

/** Each project depends on the next one; p1 also depends on p0, the one cycle. */
const projectDependencies = (index: number): string[] => {
  const dependencies: string[] = [];
  const hasNext = index < BENCHMARK_PROJECT_COUNT - 1;

  if (hasNext) dependencies.push(projectName(index + 1));

  if (index === 1) dependencies.push(projectName(0));

  return dependencies;
};

const manifestText = (index: number): string => {
  const names = projectDependencies(index);
  const entries = names.map((name): [string, string] => [name, 'workspace:*']);
  const dependencies = Object.fromEntries(entries);
  const manifest = {
    name: projectName(index),
    version: '0.0.0',
    dependencies
  };

  return JSON.stringify(manifest, null, 2);
};

const sourceText = (project: number, file: number): string => {
  const next = file + 1;
  const isLast = next === BENCHMARK_FILES_PER_PROJECT;
  const value = isLast ? '0' : `v${next} + 1`;
  const lines: string[] = [];

  if (!isLast) lines.push(`import { v${next} } from './f${next}.ts';`);

  if (file === 0) {
    const names = projectDependencies(project);
    const crossImports = names.map((name): string => `import '${name}';`);

    lines.push(...crossImports);
  }

  lines.push(`export const v${file} = ${value};`, '');

  return lines.join('\n');
};

const writeProject = (root: string, project: number): void => {
  const directory = join(root, 'packages', `p${project}`);
  const sourceDirectory = join(directory, 'src');
  const manifest = manifestText(project);

  mkdirSync(sourceDirectory, { recursive: true });
  writeFileSync(join(directory, 'package.json'), manifest);

  for (let file = 0; file < BENCHMARK_FILES_PER_PROJECT; file++) {
    const text = sourceText(project, file);

    writeFileSync(join(sourceDirectory, `f${file}.ts`), text);
  }
};

/** A git-initialised pnpm workspace of chained projects in a new temp directory. */
export const writeWorkspace = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'modular-boundaries-bench-'));
  const rootManifest = { name: 'bench', private: true };

  writeFileSync(join(root, 'package.json'), JSON.stringify(rootManifest));
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    "packages:\n  - 'packages/*'\n"
  );

  for (let project = 0; project < BENCHMARK_PROJECT_COUNT; project++) {
    writeProject(root, project);
  }

  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });

  return root;
};
