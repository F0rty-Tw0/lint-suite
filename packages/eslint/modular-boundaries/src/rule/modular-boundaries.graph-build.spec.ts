import assert from 'node:assert/strict';

import { onTestFinished, test, vi } from 'vitest';

import type { RuleOptions } from './common/modular-boundaries.type.ts';
import { IMPORT_B } from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import { lintWithRule } from './test/utils/rule-under-test.spec.util.ts';
import { extractSpecifiers } from './utils/specifiers.util.ts';

vi.mock('./utils/specifiers.util.ts', { spy: true });

// Each spy case lints its own fresh copy: a copy graphed by an earlier case hides a wrong build behind cached
// specifiers and the per-model graph cache, so the spy would read 0 vacuously.
const specifierParsesFor = (
  code: string,
  options: RuleOptions = {}
): number => {
  const workspace = copyFixtureWorkspace('cycles');
  const file = workspace.file('packages/a/src/index.ts');
  const spy = vi.mocked(extractSpecifiers);

  onTestFinished(workspace.dispose);
  spy.mockClear();
  lintWithRule(workspace.directory, file, code, options);

  return spy.mock.calls.length;
};

test('checkCircularDependencies: false never builds the graph', (): void => {
  const options = { checkCircularDependencies: false };

  assert.equal(specifierParsesFor(IMPORT_B, options), 0);
});

test('a file with no cross-project import never builds the graph', (): void => {
  assert.equal(specifierParsesFor("import './local.ts';"), 0);
});

test('positive control: a cross-project import on a fresh copy builds the graph', (): void => {
  assert.ok(specifierParsesFor(IMPORT_B) > 0);
});
