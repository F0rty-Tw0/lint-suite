import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

import { LINTER_LANGUAGE_OPTIONS_STUB } from '@lint-suite/rule-test-support/stubs/linter-config.stub.ts';

import plugin from '../../index.ts';
import { STALE_AFTER_MS } from '../common/modular-boundaries.const.ts';
import { projectGraphFor } from '../project-graph.ts';
import { validateModel, workspaceModelFor } from '../workspace-model.ts';

type Stamp = {
  readonly ino: bigint;
  readonly mtimeNs: bigint;
};

const PROJECT_COUNT = 500;
const FILES_PER_PROJECT = 100;
const SCRIPT = fileURLToPath(import.meta.url);
const SPECIFIERS_BYTES = Buffer.from('modular-boundaries-specifiers', 'utf8');
const SPECIFIERS_NAME = SPECIFIERS_BYTES.toString('base64url');
const SPECIFIERS_SUFFIX = `.${SPECIFIERS_NAME}.v1.json`;

const projectName = (index: number): string => {
  return `@bench/p${index}`;
};

/** Each project depends on the next one; p1 also depends on p0, the one cycle. */
const projectDependencies = (index: number): string[] => {
  const dependencies: string[] = [];
  const hasNext = index < PROJECT_COUNT - 1;

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
  const isLast = next === FILES_PER_PROJECT;
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

  for (let file = 0; file < FILES_PER_PROJECT; file++) {
    const text = sourceText(project, file);

    writeFileSync(join(sourceDirectory, `f${file}.ts`), text);
  }
};

const writeWorkspace = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'modular-boundaries-bench-'));
  const rootManifest = { name: 'bench', private: true };

  writeFileSync(join(root, 'package.json'), JSON.stringify(rootManifest));
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    "packages:\n  - 'packages/*'\n"
  );

  for (let project = 0; project < PROJECT_COUNT; project++) {
    writeProject(root, project);
  }

  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });

  return root;
};

const lintConfig = (): Linter.Config => {
  const constraint = { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] };
  const depConstraints = [constraint];
  const options = { depConstraints };
  const plugins = { 'modular-boundaries': plugin };
  const rules: Linter.RulesRecord = {
    'modular-boundaries/modular-boundaries': ['error', options]
  };
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: LINTER_LANGUAGE_OPTIONS_STUB,
    plugins,
    rules
  };

  return config;
};

const messageCounts = (
  results: ESLint.LintResult[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  for (const result of results) {
    for (const message of result.messages) {
      const key = `${message.ruleId}/${message.messageId}`;

      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return counts;
};

/** One `validateModel` plus the graph re-validation it triggers, on this process's cached model. */
const revalidationMs = (root: string): number => {
  const file = join(root, 'packages', 'p0', 'src', 'f0.ts');
  const model = workspaceModelFor(file);

  if (model === undefined) throw new Error(`no workspace model for ${file}`);

  const started = performance.now();
  const validated = validateModel(model);

  projectGraphFor(validated);

  return performance.now() - started;
};

const lintChild = async (mode: string, root: string): Promise<void> => {
  const overrideConfig = lintConfig();
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig
  });
  const started = performance.now();
  const results = await eslint.lintFiles(['**/*.ts']);
  const lintMs = performance.now() - started;
  const countsByMessage = messageCounts(results);
  const counts = JSON.stringify(countsByMessage);

  console.log(
    `${mode}: ${results.length} files linted in ${lintMs.toFixed(0)} ms; messages ${counts}`
  );

  if (mode !== 'warm') return;

  const passMs = revalidationMs(root);
  const passes = Math.ceil(lintMs / STALE_AFTER_MS);
  const ratio = (passMs * passes) / lintMs;
  const percent = ratio * 100;

  console.log(
    `warm: revalidation pass ${passMs.toFixed(1)} ms × ${passes} passes / ${lintMs.toFixed(0)} ms = ${percent.toFixed(2)} %`
  );
};

const runChild = (mode: string, root: string, cacheDirectory: string): void => {
  const env = { ...process.env, LINT_SUITE_CACHE_DIR: cacheDirectory };
  const args = [...process.execArgv, SCRIPT, mode, root];
  const child = spawnSync(process.execPath, args, { env, stdio: 'inherit' });

  if (child.status !== 0) {
    throw new Error(`${mode} run exited with ${child.status}`);
  }
};

const isSpecifiersCache = (entry: string): boolean => {
  return entry.endsWith(SPECIFIERS_SUFFIX);
};

const specifiersStamp = (cacheDirectory: string): Stamp => {
  const names = readdirSync(cacheDirectory);
  const name = names.find(isSpecifiersCache);

  if (name === undefined) {
    throw new Error(`no specifiers cache in ${cacheDirectory}`);
  }

  const stats = statSync(join(cacheDirectory, name), { bigint: true });
  const stamp: Stamp = { ino: stats.ino, mtimeNs: stats.mtimeNs };

  return stamp;
};

const runBenchmark = (): void => {
  const generationStarted = performance.now();
  const root = writeWorkspace();
  const generationMs = performance.now() - generationStarted;
  const cacheDirectory = mkdtempSync(
    join(tmpdir(), 'modular-boundaries-bench-cache-')
  );

  console.log(
    `workspace: ${PROJECT_COUNT} projects × ${FILES_PER_PROJECT} files in ${root} (${generationMs.toFixed(0)} ms)`
  );

  try {
    runChild('cold', root, cacheDirectory);

    const before = specifiersStamp(cacheDirectory);

    runChild('warm', root, cacheDirectory);

    const after = specifiersStamp(cacheDirectory);
    const isUnchanged =
      before.ino === after.ino && before.mtimeNs === after.mtimeNs;

    console.log(
      `specifiers cache before warm: ino ${before.ino} mtimeNs ${before.mtimeNs}`
    );
    console.log(
      `specifiers cache after warm:  ino ${after.ino} mtimeNs ${after.mtimeNs}`
    );
    console.log(`specifiers cache unchanged (0 parses): ${isUnchanged}`);
  } finally {
    rmSync(root, { force: true, recursive: true });
    rmSync(cacheDirectory, { force: true, recursive: true });
  }
};

const [mode, root] = process.argv.slice(2);
const isChild = mode !== undefined && root !== undefined;

if (isChild) await lintChild(mode, root);
else runBenchmark();
