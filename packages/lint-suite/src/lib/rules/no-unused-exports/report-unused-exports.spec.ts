import type { RuleTester } from 'eslint';

import { fixtureDirectory } from './test/utils/fixture-project.spec.util.ts';
import {
  exportError,
  invalidCase,
  moduleError,
  rule,
  ruleName,
  validCase
} from './test/utils/rule-under-test.spec.util.ts';
import { projectRuleTester } from '../test/utils/project-rule-tester.spec.util.ts';

const unusedExportsDirectory = fixtureDirectory('unused-exports');
const edgeCasesDirectory = fixtureDirectory('edge-cases');
const unusedExportsTester = projectRuleTester(unusedExportsDirectory);
const edgeCasesTester = projectRuleTester(edgeCasesDirectory);

const skippedValid: RuleTester.ValidTestCase[] = [
  validCase(
    'skips a file using export equals',
    edgeCasesDirectory,
    'export-equals.ts'
  ),
  validCase(
    'skips a file declaring an ambient module',
    edgeCasesDirectory,
    'declared-module.ts'
  )
];

const reportedInvalid: RuleTester.InvalidTestCase[] = [
  invalidCase(
    'reports individual unused names when the file is imported',
    unusedExportsDirectory,
    'orphan.ts',
    [exportError('orphanUnused')]
  ),
  invalidCase(
    'reports the whole module when no file imports it',
    unusedExportsDirectory,
    'orphan-module.ts',
    [moduleError]
  )
];

edgeCasesTester.run(ruleName, rule, { valid: skippedValid, invalid: [] });
unusedExportsTester.run(ruleName, rule, {
  valid: [],
  invalid: reportedInvalid
});
