import type { RuleTester } from 'eslint';
import { afterAll } from 'vitest';

import type { RuleOptions } from './common/modular-boundaries.type.ts';
import { IMPORT_B } from './test/common/modular-boundaries.const.ts';
import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import {
  invalidCase,
  rule,
  ruleName,
  ruleTester,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';

const cycles = copyFixtureWorkspace('cycles');

afterAll((): void => {
  cycles.dispose();
});

const cycleAFile = cycles.file('packages/a/src/index.ts');
const cycleDFile = cycles.file('packages/d/src/index.ts');
const importA = "import { a } from '@c/a';";
const ignoredPair: [string, string] = ['@c/a', '@c/d'];
const ignoreAD: RuleOptions = { ignoredCircularDependencies: [ignoredPair] };
const cycleData = {
  source: '@c/a',
  target: '@c/b',
  path: '@c/a -> @c/b -> @c/c -> @c/a'
};
const cycleError: RuleTester.TestCaseError = {
  messageId: 'noCircularDependencies',
  data: cycleData
};
const cycleErrors = [cycleError];
const threeProjectCycleCase = validCase(
  'a three-project cycle is reported with the shortest path',
  cycleAFile,
  IMPORT_B
);
const threeProjectCycle: RuleTester.InvalidTestCase = {
  ...threeProjectCycleCase,
  errors: cycleErrors
};

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'an ignored pair breaks the cycle from the source side',
    cycleAFile,
    "import { d } from '@c/d';",
    ignoreAD
  ),
  validCase(
    'an ignored pair breaks the cycle from the target side',
    cycleDFile,
    importA,
    ignoreAD
  )
];

const invalid: RuleTester.InvalidTestCase[] = [
  threeProjectCycle,
  invalidCase(
    validCase(
      'reports the cycle an ignored pair would break when it is not ignored',
      cycleDFile,
      importA
    ),
    'noCircularDependencies'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });
