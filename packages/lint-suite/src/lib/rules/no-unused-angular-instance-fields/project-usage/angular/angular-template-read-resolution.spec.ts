import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../utils/project-analysis-case.spec.util.ts';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);

const templateReadCase = projectValidCase(
  'accepts a directive field read by an Angular template in project mode',
  projectUsageDirectory,
  'project-template.directive.ts'
);

const valid = [templateReadCase];

projectUsageTester.run(ruleName, rule, { valid, invalid: [] });
