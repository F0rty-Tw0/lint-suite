import type { RuleTester } from 'eslint';
import { afterAll } from 'vitest';

import {
  FEATURE_FILE_PATH,
  IMPORT_DATA,
  IMPORT_UI,
  IMPORT_UTIL
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
const broken = copyFixtureWorkspace('broken');

afterAll((): void => {
  pnpm.dispose();
  nx.dispose();
  broken.dispose();
});

const featureFile = pnpm.file(FEATURE_FILE_PATH);
const dataFile = pnpm.file('packages/data/src/index.ts');
const utilFile = nx.file('libs/util/src/u.ts');
const shellFile = nx.file('libs/shell/src/s.ts');
const importLodash = "import lodash from 'lodash';";
const banLodash = constraintOptions({
  sourceTag: 'type:feature',
  bannedExternalImports: ['lodash']
});
const banMoment = constraintOptions({
  sourceTag: 'type:feature',
  bannedExternalImports: ['moment']
});
const undeclaredOff = { checkUndeclaredDependencies: false };
const banMomentQuiet = { ...banMoment, ...undeclaredOff };

const valid: RuleTester.ValidTestCase[] = [
  validCase(
    'allows a relative import inside the project',
    featureFile,
    "import './b.ts';"
  ),
  validCase('allows a declared workspace package', featureFile, IMPORT_DATA),
  validCase(
    'allows an import through the alias of another project',
    shellFile,
    IMPORT_UTIL
  ),
  validCase(
    'allows an external import that is not banned',
    featureFile,
    importLodash,
    banMomentQuiet
  ),
  validCase(
    'silences undeclared dependencies when disabled',
    featureFile,
    importLodash,
    undeclaredOff
  ),
  validCase(
    'ignores a file outside the configured workspace root',
    featureFile,
    IMPORT_DATA,
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
      IMPORT_UTIL
    ),
    'noSelfCircularDependencies'
  ),
  invalidCase(
    validCase(
      'reports a banned external import',
      featureFile,
      importLodash,
      banLodash
    ),
    'bannedExternalImportsViolation'
  ),
  invalidCase(
    validCase('reports an undeclared npm import', featureFile, importLodash),
    'undeclaredDependency'
  ),
  invalidCase(
    validCase(
      'reports an undeclared workspace package import',
      dataFile,
      IMPORT_UI
    ),
    'undeclaredDependency'
  )
];

ruleTester().run(ruleName, rule, { valid, invalid });
