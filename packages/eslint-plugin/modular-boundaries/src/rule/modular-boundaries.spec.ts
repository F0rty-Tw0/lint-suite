import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import type { Linter, RuleTester } from 'eslint';
import { afterAll, onTestFinished, test, vi } from 'vitest';

import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import {
  constraintOptions,
  invalidCase,
  lintWithRule,
  rule,
  ruleName,
  ruleTester,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';

const pnpm = copyFixtureWorkspace('pnpm-plain');
const nx = copyFixtureWorkspace('nx');
const broken = copyFixtureWorkspace('broken');

afterAll((): void => {
  pnpm.dispose();
  nx.dispose();
  broken.dispose();
});

const featureFile = pnpm.file('packages/feature/src/a.ts');
const dataFile = pnpm.file('packages/data/src/index.ts');
const utilFile = nx.file('libs/util/src/u.ts');
const shellFile = nx.file('libs/shell/src/s.ts');
const importData = "import { data } from '@ws/data';";
const importUi = "import { ui } from '@ws/ui';";
const importUtil = "import { util } from '@acme/util';";
const onlyUi = constraintOptions({
  sourceTag: 'type:feature',
  onlyDependOnLibsWithTags: ['type:ui']
});
const emptyOnly = constraintOptions({
  sourceTag: 'type:feature',
  onlyDependOnLibsWithTags: []
});
const notData = constraintOptions({
  sourceTag: 'type:feature',
  notDependOnLibsWithTags: ['type:data']
});
const banLodash = constraintOptions({
  sourceTag: 'type:feature',
  bannedExternalImports: ['lodash']
});
const banMoment = constraintOptions({
  sourceTag: 'type:feature',
  bannedExternalImports: ['moment']
});
const featureOnly = constraintOptions({ sourceTag: 'type:feature' });
const undeclaredOff = { checkUndeclaredDependencies: false };
const banMomentQuiet = { ...banMoment, ...undeclaredOff };

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'allows a relative import inside the project',
    featureFile,
    "import './b.ts';"
  ),
  validCase('allows a declared workspace package', featureFile, importData),
  validCase(
    'allows an import through the alias of another project',
    shellFile,
    importUtil
  ),
  validCase(
    'allows a target carrying an allowed tag',
    featureFile,
    importUi,
    onlyUi
  ),
  validCase(
    'allows a target without forbidden tags',
    featureFile,
    importUi,
    notData
  ),
  validCase(
    'allows an untagged target under an empty allow list',
    shellFile,
    importUtil,
    emptyOnly
  ),
  validCase(
    'allows an external import that is not banned',
    featureFile,
    "import lodash from 'lodash';",
    banMomentQuiet
  ),
  validCase(
    'allows a tagged source under ESLint constraints',
    shellFile,
    importUtil,
    featureOnly
  ),
  validCase(
    'silences undeclared dependencies when disabled',
    featureFile,
    "import lodash from 'lodash';",
    undeclaredOff
  ),
  validCase(
    'skips package subpath imports and unresolved aliases',
    featureFile,
    "import internal from '#internal';\nimport x from '@/x';"
  ),
  validCase(
    'skips a non-literal specifier and a non-require call',
    featureFile,
    'const a = require(name);\nconst b = load("@ws/data");\nconst c = import(`@ws/${name}`);',
    onlyUi
  ),
  validCase('skips allowed specifiers', featureFile, importData, {
    ...onlyUi,
    allow: ['@ws/*']
  }),
  validCase(
    'ignores a file outside the configured workspace root',
    featureFile,
    importData,
    { workspaceRoot: broken.directory }
  )
];

const invalid: RuleTester.InvalidTestCase[] = [
  invalidCase(
    validCase(
      'reports a relative import into another project',
      featureFile,
      "import { ui } from '../../ui/src/index.ts';"
    ),
    'noRelativeOrAbsoluteImportsAcrossLibraries'
  ),
  invalidCase(
    validCase(
      'reports a project importing its own package name',
      featureFile,
      "import '@ws/feature';"
    ),
    'noSelfCircularDependencies'
  ),
  invalidCase(
    validCase(
      'reports a project importing itself through an alias',
      utilFile,
      importUtil
    ),
    'noSelfCircularDependencies'
  ),
  invalidCase(
    validCase(
      'reports a banned external import',
      featureFile,
      "import lodash from 'lodash';",
      banLodash
    ),
    'bannedExternalImportsViolation'
  ),
  invalidCase(
    validCase(
      'reports an undeclared npm import',
      featureFile,
      "import lodash from 'lodash';"
    ),
    'undeclaredDependency'
  ),
  invalidCase(
    validCase(
      'reports an undeclared workspace package import',
      dataFile,
      importUi
    ),
    'undeclaredDependency'
  ),
  invalidCase(
    validCase(
      'reports an untagged source under ESLint constraints',
      utilFile,
      "import { named } from '@acme/named';",
      featureOnly
    ),
    'projectWithoutTagsCannotHaveDependencies'
  ),
  invalidCase(
    validCase(
      'reports a target missing every allowed tag',
      featureFile,
      importData,
      onlyUi
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a tagged target under an empty allow list',
      featureFile,
      importData,
      emptyOnly
    ),
    'emptyOnlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a target carrying a forbidden tag',
      featureFile,
      importData,
      notData
    ),
    'notTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks import type declarations',
      featureFile,
      "import type { data } from '@ws/data';",
      onlyUi
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks export all and named re-exports',
      featureFile,
      "export * from '@ws/data';\nexport { data } from '@ws/data';",
      onlyUi
    ),
    'onlyTagsConstraintViolation',
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks require calls and import equals',
      featureFile,
      "const a = require('@ws/data');\nimport b = require('@ws/data');",
      onlyUi
    ),
    'onlyTagsConstraintViolation',
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks dynamic imports and template specifiers',
      featureFile,
      'const a = import(`@ws/data`);',
      onlyUi
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks typeof import types',
      featureFile,
      "type A = typeof import('@ws/data');",
      onlyUi
    ),
    'onlyTagsConstraintViolation'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });

const configErrorsOf = (
  messages: Linter.LintMessage[]
): Linter.LintMessage[] => {
  return messages.filter(
    (message) => message.messageId === 'workspaceConfigError'
  );
};

test('reports each workspace config error once on line 1 of a file with three imports', (): void => {
  const okFile = broken.file('packages/ok/src/a.ts');
  const code = readFileSync(okFile, 'utf8');
  const messages = lintWithRule(broken.directory, okFile, code);
  const configErrors = configErrorsOf(messages);
  const lines = messages.map((message) => message.line);
  const malformed = messages.find((message) =>
    message.message.includes('packages/bad/package.json:')
  );

  assert.equal(messages.length, 2);
  assert.equal(configErrors.length, 2);
  assert.deepEqual(lines, [1, 1]);
  assert.ok(malformed);
});

test('reports only config errors for a file outside every project', (): void => {
  const looseFile = broken.file('scripts/loose.ts');
  const code = readFileSync(looseFile, 'utf8');
  const messages = lintWithRule(broken.directory, looseFile, code, onlyUi);
  const configErrors = configErrorsOf(messages);

  assert.equal(messages.length, 2);
  assert.equal(configErrors.length, 2);
});

// The cwd points at the broken workspace so a relative filename would land inside it: without the guard the
// rule would report its two config errors.
test('ignores a non-absolute filename', (): void => {
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(broken.directory);
  const options = { workspaceRoot: broken.directory };

  onTestFinished(() => cwd.mockRestore());

  const messages = lintWithRule(
    broken.directory,
    'packages/ok/src/a.ts',
    importData,
    options
  );

  assert.deepEqual(messages, []);
});

test('rejects an unknown option in the schema', (): void => {
  const options = { enforceBuildableLibDependency: true };
  const lint = (): Linter.LintMessage[] =>
    lintWithRule(pnpm.directory, featureFile, importData, options);

  assert.throws(lint, /additional properties/i);
});

test('rejects a constraint with both sourceTag and allSourceTags', (): void => {
  const depConstraints = [{ sourceTag: 'a', allSourceTags: ['b'] }];
  const options = { depConstraints };
  const lint = (): Linter.LintMessage[] =>
    lintWithRule(pnpm.directory, featureFile, importData, options);

  assert.throws(lint, /oneOf|exactly one/i);
});
