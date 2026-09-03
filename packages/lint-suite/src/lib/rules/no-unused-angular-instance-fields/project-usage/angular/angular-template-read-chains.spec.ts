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
      name: 'collects directive members from called and safely navigated chain segments',
      ...fixtureCase(discoveryDirectory, 'chain.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadState' } }]
    }
  ]
});
