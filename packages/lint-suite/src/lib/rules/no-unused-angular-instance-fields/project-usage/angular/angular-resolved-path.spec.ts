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
      name: 'accepts a nested member chain resolved on the component type',
      ...fixtureCase(projectDirectory, 'src/external-template.component.ts'),
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a directive member resolved through a nested property chain',
      ...fixtureCase(projectDirectory, 'src/export-as.directive.ts'),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
