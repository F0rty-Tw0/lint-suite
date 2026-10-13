import type { RuleTester } from 'eslint';
import { afterAll } from 'vitest';

import { copyFixtureWorkspace } from './test/utils/fixture-workspace.spec.util.ts';
import {
  invalidCase,
  rule,
  ruleName,
  ruleTester,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';

const turbo = copyFixtureWorkspace('turbo');
const moon = copyFixtureWorkspace('moon');

afterAll((): void => {
  turbo.dispose();
  moon.dispose();
});

const importInternal = "import { internal } from '@t/internal';";
const importComp = "import { comp } from '@moon/comp';";
const webFile = turbo.file('packages/web/src/a.ts');
const moonAppFile = moon.file('apps/app/src/b.ts');
const turboSourceOff = { turbo: false };
const moonSourceOff = { moon: false };
const turboOff = { configSources: turboSourceOff };
const moonOff = { configSources: moonSourceOff };

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'allows a dependent named in a turbo dependents allow list',
    turbo.file('packages/admin/src/a.ts'),
    importInternal
  ),
  validCase(
    'ignores root turbo.json boundaries when configSources.turbo is false',
    webFile,
    importInternal,
    turboOff
  ),
  validCase(
    'ignores moon tag relationships when configSources.moon is false',
    moonAppFile,
    importComp,
    moonOff
  )
];

const invalid: RuleTester.InvalidTestCase[] = [
  invalidCase(
    validCase(
      'reports a turbo dependencies deny match',
      webFile,
      importInternal
    ),
    'notTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a dependent missing from a turbo dependents allow list',
      turbo.file('packages/other/src/a.ts'),
      importInternal
    ),
    'onlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports every project dependency under turbo allow: []',
      turbo.file('packages/leaf/src/a.ts'),
      "import { admin } from '@t/admin';"
    ),
    'emptyOnlyTagsConstraintViolation'
  ),
  invalidCase(
    validCase(
      'reports a target outside a moon tag relationship',
      moonAppFile,
      importComp
    ),
    'onlyTagsConstraintViolation'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });
