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
      name: 'reads a directive member through an exportAs given as a constant',
      ...fixtureCase(discoveryDirectory, 'constant-metadata.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadConstant' } }]
    },
    {
      name: 'reports a member missing from a template whose templateUrl is a constant',
      ...fixtureCase(discoveryDirectory, 'constant-metadata.host.component.ts'),
      options: [{ analysis: 'project' }],
      errors: [
        { messageId: 'unusedField', data: { name: 'missingFromTemplate' } }
      ]
    }
  ]
});
