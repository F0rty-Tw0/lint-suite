import {
  fixtureCase,
  fixtureDirectory
} from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);
const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

projectUsageTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a field read by destructuring in another project file',
      ...fixtureCase(
        projectUsageDirectory,
        'project-destructuring.component.ts'
      ),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});

projectTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts members read by a named binding and by a rest element',
      ...fixtureCase(
        projectDirectory,
        'src/read-by-destructuring.component.ts'
      ),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
