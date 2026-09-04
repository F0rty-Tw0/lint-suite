import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.js';

const ignoresNonAngularClasses: RuleTester.ValidTestCase = {
  name: 'ignores fields outside Angular components and directives',
  code: `class Service { private unused = 'unused'; }`
};

const acceptsAliasedComponentTemplateRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by the template of an aliased Component import',
  code: component(
    `protected fromTemplate = 'used';`,
    `template: '{{ fromTemplate }}'`,
    'Component as NgComponent',
    'NgComponent'
  )
};

const reportsNamespaceImportedComponentField: RuleTester.InvalidTestCase = {
  name: 'reports an unused field in a namespace-imported component',
  code: `import * as ng from '@angular/core'; @ng.Component({ template: '' })
        class TestComponent { private unused = ''; }`,
  errors: [unusedFieldError('unused')]
};

const reportsAliasedComponentField: RuleTester.InvalidTestCase = {
  name: 'reports an unused field in a component with an aliased Component import',
  code: component(
    `private unused = '';`,
    `template: ''`,
    'Component as NgComponent',
    'NgComponent'
  ),
  errors: [unusedFieldError('unused')]
};

const valid: RuleTester.ValidTestCase[] = [
  ignoresNonAngularClasses,
  acceptsAliasedComponentTemplateRead
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsNamespaceImportedComponentField,
  reportsAliasedComponentField
];

ruleTester.run(ruleName, rule, { valid, invalid });
