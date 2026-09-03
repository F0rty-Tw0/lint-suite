import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'ignores fields outside Angular components and directives',
      code: `class Service { private unused = 'unused'; }`
    },
    {
      name: 'accepts a field read by the template of an aliased Component import',
      code: component(
        `protected fromTemplate = 'used';`,
        `template: '{{ fromTemplate }}'`,
        'Component as NgComponent',
        'NgComponent'
      )
    }
  ],
  invalid: [
    {
      name: 'reports an unused field in a namespace-imported component',
      code: `import * as ng from '@angular/core'; @ng.Component({ template: '' })
        class TestComponent { private unused = ''; }`,
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    },
    {
      name: 'reports an unused field in a component with an aliased Component import',
      code: component(
        `private unused = '';`,
        `template: ''`,
        'Component as NgComponent',
        'NgComponent'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    }
  ]
});
