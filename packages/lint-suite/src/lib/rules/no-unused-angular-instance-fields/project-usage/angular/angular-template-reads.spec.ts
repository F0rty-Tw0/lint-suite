import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';
import {
  memberError,
  projectInvalidCase,
  projectValidCase
} from '../utils/project-analysis-case.spec.util.js';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);
const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);

const unreadConstantError = memberError('unusedField', 'unreadConstant');
const externalTemplateCase = projectInvalidCase(
  'reads a directive member from the external template file of another component',
  discoveryDirectory,
  'constant-metadata.directive.ts',
  [unreadConstantError]
);

const invalid = [externalTemplateCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });

const templateReadCase = projectValidCase(
  'accepts a directive field read by an Angular template in project mode',
  projectUsageDirectory,
  'project-template.directive.ts'
);

const valid = [templateReadCase];

projectUsageTester.run(ruleName, rule, { valid, invalid: [] });
