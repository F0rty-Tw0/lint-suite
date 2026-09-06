import { projectRuleTester } from '../../../utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../utils/project-analysis-case.spec.util.ts';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

const unreadConstantError = memberError('unusedField', 'unreadConstant');
const externalTemplateCase = projectInvalidCase(
  'reads a directive member from the external template file of another component',
  discoveryDirectory,
  'constant-metadata.directive.ts',
  [unreadConstantError]
);

const invalid = [externalTemplateCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
