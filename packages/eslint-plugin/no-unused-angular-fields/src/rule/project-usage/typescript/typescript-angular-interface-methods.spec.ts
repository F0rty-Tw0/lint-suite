import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../test/utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const valueAccessorCase = projectValidCase(
  'accepts forms interface methods implemented for Angular to call',
  projectDirectory,
  'src/value-accessor.component.ts'
);

const valid = [valueAccessorCase];

projectTester.run(ruleName, rule, { valid, invalid: [] });
