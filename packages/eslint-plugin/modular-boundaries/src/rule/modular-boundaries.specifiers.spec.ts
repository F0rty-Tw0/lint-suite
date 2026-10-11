import type { RuleTester } from 'eslint';
import { afterAll } from 'vitest';

import {
  FEATURE_FILE_PATH,
  IMPORT_DATA,
  ONLY_UI_OPTIONS
} from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import {
  invalidCase,
  rule,
  ruleName,
  ruleTester,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';

const pnpm = copyFixtureWorkspace('pnpm-plain');

afterAll((): void => {
  pnpm.dispose();
});

const featureFile = pnpm.file(FEATURE_FILE_PATH);
const allowWs = { ...ONLY_UI_OPTIONS, allow: ['@ws/*'] };

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'skips package subpath imports and unresolved aliases',
    featureFile,
    "import internal from '#internal';\nimport x from '@/x';"
  ),
  validCase(
    'skips a non-literal specifier and a non-require call',
    featureFile,
    'const a = require(name);\nconst b = load("@ws/data");\nconst c = import(`@ws/${name}`);',
    ONLY_UI_OPTIONS
  ),
  validCase('skips allowed specifiers', featureFile, IMPORT_DATA, allowWs)
];

const invalid: RuleTester.InvalidTestCase[] = [
  invalidCase(
    validCase(
      'checks import type declarations',
      featureFile,
      "import type { data } from '@ws/data';",
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks export all and named re-exports',
      featureFile,
      "export * from '@ws/data';\nexport { data } from '@ws/data';",
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation',
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks require calls and import equals',
      featureFile,
      "const a = require('@ws/data');\nimport b = require('@ws/data');",
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation',
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks dynamic imports and template specifiers',
      featureFile,
      'const a = import(`@ws/data`);',
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'checks typeof import types',
      featureFile,
      "type A = typeof import('@ws/data');",
      ONLY_UI_OPTIONS
    ),
    'onlyTagsConstraintViolation'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });
