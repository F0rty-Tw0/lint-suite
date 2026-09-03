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
      name: 'reads a directive member through a reference inside the standalone imports scope',
      ...fixtureCase(discoveryDirectory, 'scoped-dual.in-scope.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadInScope' } }]
    },
    {
      name: 'reports a directive member whose exportAs twin is outside the standalone imports scope',
      ...fixtureCase(
        discoveryDirectory,
        'scoped-dual.out-of-scope.directive.ts'
      ),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    }
  ]
});
