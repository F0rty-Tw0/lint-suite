import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

import { LINTER_LANGUAGE_OPTIONS_STUB } from '@lint-suite/rule-test-support/stubs/linter-config.stub.ts';
import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

import plugin from '../../index.ts';
import { STALE_AFTER_MS } from '../common/modular-boundaries.const.ts';
import { projectGraphFor } from '../project-graph.ts';
import { validateModel, workspaceModelFor } from '../workspace-model.ts';
import {
  BENCHMARK_FILES_PER_PROJECT,
  BENCHMARK_PROJECT_COUNT
} from './common/modular-boundaries.const.ts';
import { writeWorkspace } from './utils/benchmark-workspace.spec.util.ts';

type Stamp = {
  readonly ino: bigint;
  readonly mtimeNs: bigint;
};

const SCRIPT = fileURLToPath(import.meta.url);
const CACHE_DIR_ENV = 'LINT_SUITE_CACHE_DIR';
const SPECIFIERS_BYTES = Buffer.from('modular-boundaries-specifiers', 'utf8');
const SPECIFIERS_NAME = SPECIFIERS_BYTES.toString('base64url');
const SPECIFIERS_SUFFIX = `.${SPECIFIERS_NAME}.v1.json`;

const report = (line: string): void => {
  process.stdout.write(`${line}\n`);
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

  report(
    `${mode}: ${results.length} files linted in ${lintMs.toFixed(0)} ms; messages ${counts}`
  );

  if (mode !== 'warm') return;

  const passMs = revalidationMs(root);
  const passes = Math.ceil(lintMs / STALE_AFTER_MS);
  const ratio = (passMs * passes) / lintMs;
  const percent = ratio * 100;

  report(
    `warm: revalidation pass ${passMs.toFixed(1)} ms × ${passes} passes / ${lintMs.toFixed(0)} ms = ${percent.toFixed(2)} %`
  );
};

const runChild = (mode: string, root: string, cacheDirectory: string): void => {
  const env = { ...process.env, [CACHE_DIR_ENV]: cacheDirectory };
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

  report(
    `workspace: ${BENCHMARK_PROJECT_COUNT} projects × ${BENCHMARK_FILES_PER_PROJECT} files in ${root} (${generationMs.toFixed(0)} ms)`
  );

  try {
    runChild('cold', root, cacheDirectory);

    const before = specifiersStamp(cacheDirectory);

    runChild('warm', root, cacheDirectory);

    const after = specifiersStamp(cacheDirectory);
    const isUnchanged =
      before.ino === after.ino && before.mtimeNs === after.mtimeNs;

    report(
      `specifiers cache before warm: ino ${before.ino} mtimeNs ${before.mtimeNs}`
    );
    report(
      `specifiers cache after warm:  ino ${after.ino} mtimeNs ${after.mtimeNs}`
    );
    report(`specifiers cache unchanged (0 parses): ${isUnchanged}`);

    if (!isUnchanged) process.exitCode = 1;
  } finally {
    rmSync(root, { force: true, recursive: true });
    rmSync(cacheDirectory, { force: true, recursive: true });
  }
};

const [mode, root] = process.argv.slice(2);
const isChild = mode !== undefined && root !== undefined;

if (isChild) await lintChild(mode, root);
else runBenchmark();
