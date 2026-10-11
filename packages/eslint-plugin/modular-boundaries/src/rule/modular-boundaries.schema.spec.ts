import assert from 'node:assert/strict';

import type { Linter } from 'eslint';
import { afterAll, test } from 'vitest';

import {
  FEATURE_FILE_PATH,
  IMPORT_DATA
} from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import { lintWithRule } from './test/utils/rule-under-test.spec.util.ts';

const pnpm = copyFixtureWorkspace('pnpm-plain');

afterAll((): void => {
  pnpm.dispose();
});

const featureFile = pnpm.file(FEATURE_FILE_PATH);

test('rejects an unknown option in the schema', (): void => {
  const options = { enforceBuildableLibDependency: true };
  const lint = (): Linter.LintMessage[] =>
    lintWithRule(pnpm.directory, featureFile, IMPORT_DATA, options);

  assert.throws(lint, /additional properties/i);
});

test('rejects a constraint with both sourceTag and allSourceTags', (): void => {
  const depConstraints = [{ sourceTag: 'a', allSourceTags: ['b'] }];
  const options = { depConstraints };
  const lint = (): Linter.LintMessage[] =>
    lintWithRule(pnpm.directory, featureFile, IMPORT_DATA, options);

  assert.throws(lint, /oneOf|exactly one/i);
});
