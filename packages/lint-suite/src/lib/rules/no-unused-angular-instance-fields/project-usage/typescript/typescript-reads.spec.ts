import {
  fixtureCase,
  fixtureDirectory
} from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';

const projectUsageDirectory = fixtureDirectory('project-usage');
const projectUsageTester = projectRuleTester(projectUsageDirectory);
const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

projectUsageTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a field read by a property access in another project file',
      ...fixtureCase(projectUsageDirectory, 'project-property.component.ts'),
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a field read by an element access in another project file',
      ...fixtureCase(projectUsageDirectory, 'project-element.component.ts'),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});

projectTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts members read through optional chaining and a non-null assertion',
      ...fixtureCase(projectDirectory, 'src/optional-chaining.component.ts'),
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts forms interface methods implemented for Angular to call',
      ...fixtureCase(projectDirectory, 'src/value-accessor.component.ts'),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: [
    {
      name: 'reports a field only assigned from another project file',
      ...fixtureCase(projectDirectory, 'src/written-elsewhere.component.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'assigned' } }]
    },
    {
      name: 'reports a field reached only through an any cast',
      ...fixtureCase(projectDirectory, 'src/any-cast.component.ts'),
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'viaAny' } }]
    }
  ]
});
