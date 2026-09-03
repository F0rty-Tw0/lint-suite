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
const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);

discoveryTester.run(ruleName, rule, {
  valid: [],
  invalid: [
    {
      name: 'reads a directive member from the external template file of another component',
      ...fixtureCase(discoveryDirectory, 'constant-metadata.directive.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadConstant' } }]
    }
  ]
});

projectUsageTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a directive field read by an Angular template in project mode',
      ...fixtureCase(projectUsageDirectory, 'project-template.directive.ts'),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
