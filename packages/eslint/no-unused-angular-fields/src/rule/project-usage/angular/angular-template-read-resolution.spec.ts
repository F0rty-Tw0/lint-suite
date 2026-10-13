import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../test/utils/project-analysis-case.spec.util.ts';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);

const templateReadCase = projectValidCase(
  'accepts a directive field read by an Angular template in project mode',
  projectUsageDirectory,
  'project-template.directive.ts'
);

const valid = [templateReadCase];

projectUsageTester.run(ruleName, rule, { valid, invalid: [] });
