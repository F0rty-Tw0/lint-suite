import { projectRuleTester } from '../../../test/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import { projectValidCase } from '../test/utils/project-analysis-case.spec.util.ts';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);
const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const crossFileDestructuringCase = projectValidCase(
  'accepts a field read by destructuring in another project file',
  projectUsageDirectory,
  'project-destructuring.component.ts'
);

const projectUsageValid = [crossFileDestructuringCase];

projectUsageTester.run(ruleName, rule, {
  valid: projectUsageValid,
  invalid: []
});

const bindingAndRestCase = projectValidCase(
  'accepts members read by a named binding and by a rest element',
  projectDirectory,
  'src/read-by-destructuring.component.ts'
);

const projectValid = [bindingAndRestCase];

projectTester.run(ruleName, rule, { valid: projectValid, invalid: [] });
