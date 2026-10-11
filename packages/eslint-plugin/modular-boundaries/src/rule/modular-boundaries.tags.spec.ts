import type { RuleTester } from 'eslint';
import { afterAll } from 'vitest';

import {
  FEATURE_FILE_PATH,
  IMPORT_DATA,
  IMPORT_UI,
  IMPORT_UTIL,
  ONLY_UI_OPTIONS
} from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import {
  constraintOptions,
  invalidCase,
  rule,
  ruleName,
  ruleTester,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';

const pnpm = copyFixtureWorkspace('pnpm-plain');
const nx = copyFixtureWorkspace('nx');

afterAll((): void => {
  pnpm.dispose();
  nx.dispose();
});

const featureFile = pnpm.file(FEATURE_FILE_PATH);
const utilFile = nx.file('libs/util/src/u.ts');
const shellFile = nx.file('libs/shell/src/s.ts');
const emptyOnly = constraintOptions({
  sourceTag: 'type:feature',
  onlyDependOnLibsWithTags: []
});
const notData = constraintOptions({
  sourceTag: 'type:feature',
  notDependOnLibsWithTags: ['type:data']
});
const featureOnly = constraintOptions({ sourceTag: 'type:feature' });

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'allows a target carrying an allowed tag',
    featureFile,
    IMPORT_UI,
    ONLY_UI_OPTIONS
  ),
  validCase(
    'allows a target without forbidden tags',
    featureFile,
    IMPORT_UI,
    notData
  ),
  validCase(
    'allows an untagged target under an empty allow list',
    shellFile,
    IMPORT_UTIL,
    emptyOnly
  ),
  validCase(
    'allows a tagged source under ESLint constraints',
    shellFile,
    IMPORT_UTIL,
    featureOnly
  )
];

const invalid: RuleTester.InvalidTestCase[] = [
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
      IMPORT_DATA,
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a tagged target under an empty allow list',
      featureFile,
      IMPORT_DATA,
      emptyOnly
    ),
    'emptyOnlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a target carrying a forbidden tag',
      featureFile,
      IMPORT_DATA,
      notData
    ),
    'notTagsConstraintViolation'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });
