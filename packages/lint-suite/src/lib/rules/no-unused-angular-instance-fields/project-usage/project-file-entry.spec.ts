import {
  fixtureCase,
  fixtureDirectory
} from '../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../utils/rule-under-test.spec.util.js';

const projectDirectory = fixtureDirectory('project-usage');
const projectTester = projectRuleTester(projectDirectory);

projectTester.run(ruleName, rule, {
  valid: [],
  invalid: [
    {
      name: 'reports unread fields after a successful project analysis',
      ...fixtureCase(projectDirectory, 'project-unread.component.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadInProject' } }]
    }
  ]
});
