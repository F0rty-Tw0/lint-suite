import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const acceptsArrowFunctionThisRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read through lexical this in an arrow function',
  code: component(
    `private value = ''; public read(): string { const nested = (): string => this.value; return nested(); }`,
    { metadata: `template: '{{ read() }}'` }
  )
};

const errors = [unusedFieldError('value')];

const reportsNestedFunctionThisRead: RuleTester.InvalidTestCase = {
  name: 'does not count this inside a nested normal function as a component field read',
  code: component(
    `private value = ''; public read(): string { function nested(): string { return this.value; } return nested(); }`,
    { metadata: `template: '{{ read() }}'` }
  ),
  errors
};

const reportsStaticBlockThisRead: RuleTester.InvalidTestCase = {
  name: 'does not count this inside a static block as a component field read',
  code: component(
    `private value = ''; static { const local: unknown = this.value; void local; }`,
    { metadata: `template: ''` }
  ),
  errors
};

const valid: RuleTester.ValidTestCase[] = [acceptsArrowFunctionThisRead];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsNestedFunctionThisRead,
  reportsStaticBlockThisRead
];

ruleTester.run(ruleName, rule, { valid, invalid });
