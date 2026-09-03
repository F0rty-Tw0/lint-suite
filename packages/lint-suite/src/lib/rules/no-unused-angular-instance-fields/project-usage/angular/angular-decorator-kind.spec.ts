import {
  fixtureCase,
  fixtureDirectory
} from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

discoveryTester.run(ruleName, rule, {
  valid: [],
  invalid: [
    {
      name: 'reports only the member unread by a template behind aliased and namespaced decorators',
      ...fixtureCase(discoveryDirectory, 'aliased-decorator.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadAlias' } }]
    }
  ]
});
