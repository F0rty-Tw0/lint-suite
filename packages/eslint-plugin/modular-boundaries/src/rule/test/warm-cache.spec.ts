import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Linter } from 'eslint';
import type { ESLint } from 'eslint';
import { afterAll, test, vi } from 'vitest';

import { LINTER_LANGUAGE_OPTIONS_STUB } from '@lint-suite/rule-test-support/stubs/linter-config.stub.ts';

import { copyFixtureWorkspace } from './utils/fixture-workspace.spec.util.ts';

type FlushFileCaches = () => void;

// vi.mock is hoisted and survives vi.resetModules, so every fresh plugin import parses through this one spy.
const spy = vi.hoisted(() => vi.fn<(text: string) => string[]>());

vi.mock(import('../utils/specifiers.util.ts'), async (importOriginal) => {
  const original = await importOriginal();

  spy.mockImplementation(original.extractSpecifiers);

  const mocked = { ...original, extractSpecifiers: spy };

  return mocked;
});

const workspace = copyFixtureWorkspace('cycles');
const cacheDirectory = mkdtempSync(join(tmpdir(), 'lint-suite-warm-cache-'));

afterAll((): void => {
  workspace.dispose();
  rmSync(cacheDirectory, { force: true, recursive: true });
  vi.unstubAllEnvs();
});

const linterConfig = (plugin: ESLint.Plugin): Linter.Config => {
  const plugins = { 'modular-boundaries': plugin };
  const rules: Linter.RulesRecord = {
    'modular-boundaries/modular-boundaries': 'error'
  };
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: LINTER_LANGUAGE_OPTIONS_STUB,
    plugins,
    rules
  };

  return config;
};

/** Lints with a fresh module registry, so only the disk cache carries over; returns that registry's flush. */
const lintWithFreshModules = async (file: string): Promise<FlushFileCaches> => {
  vi.resetModules();

  const { default: plugin } = await import('../../index.ts');
  const { flushFileCaches } = await import(
    '@lint-suite/rule-internals/file-cache.ts'
  );
  const code = readFileSync(file, 'utf8');
  const config = linterConfig(plugin);
  const linter = new Linter({ cwd: workspace.directory });

  linter.verify(code, config, file);

  return flushFileCaches;
};

test('a warm disk cache lints a cross-project import without parsing specifiers', async (): Promise<void> => {
  const file = workspace.file('packages/a/src/index.ts');

  vi.stubEnv('LINT_SUITE_CACHE_DIR', cacheDirectory);

  const flushFileCaches = await lintWithFreshModules(file);

  assert.ok(spy.mock.calls.length > 0);

  flushFileCaches();
  spy.mockClear();
  await lintWithFreshModules(file);

  assert.equal(spy.mock.calls.length, 0);
});
