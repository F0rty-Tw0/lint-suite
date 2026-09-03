import {
  fixtureCase,
  fixtureDirectory
} from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

projectTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a member read through a union of two component types',
      ...fixtureCase(projectDirectory, 'src/read-through-union.component.ts'),
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts fields read by a literal and a literal-union element access key',
      ...fixtureCase(
        projectDirectory,
        'src/read-by-element-access.component.ts'
      ),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
