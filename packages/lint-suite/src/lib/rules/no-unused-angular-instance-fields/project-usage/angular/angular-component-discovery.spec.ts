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
  valid: [],
  invalid: [
    {
      name: 'reports unread members of a component discovered in project mode',
      ...fixtureCase(projectDirectory, 'src/unread-members.component.ts'),
      options: [{ analysis: 'project' }],
      errors: [
        { messageId: 'unusedField', data: { name: 'leftover' } },
        { messageId: 'unusedMethod', data: { name: 'helper' } }
      ]
    },
    {
      name: 'reports an unread public field of a directive discovered in project mode',
      ...fixtureCase(projectDirectory, 'src/unread-public.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'exposed' } }]
    }
  ]
});
