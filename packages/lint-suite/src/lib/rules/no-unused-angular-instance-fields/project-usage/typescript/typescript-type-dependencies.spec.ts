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
      name: 'accepts a base-class field read only by a subclass in another file',
      ...fixtureCase(
        projectDirectory,
        'src/read-by-subclass.base.component.ts'
      ),
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a subclass member read by its own template',
      ...fixtureCase(
        projectDirectory,
        'src/read-by-subclass.child.component.ts'
      ),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
