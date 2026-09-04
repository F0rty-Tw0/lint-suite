import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a field read by class TypeScript',
    code: component(
      `private value = 'used'; public read(): string { return this.value; }`,
      `template: '{{ read() }}'`
    )
  },
  {
    name: 'accepts a field read through object destructuring from this',
    code: component(
      `private value = 'used'; public read(): string { const { value } = this; return value; }`,
      `template: '{{ read() }}'`
    )
  },
  {
    name: 'accepts a field read through lexical this in an arrow function',
    code: component(
      `private value = ''; public read(): string { const nested = (): string => this.value; return nested(); }`,
      `template: '{{ read() }}'`
    )
  },
  {
    name: 'accepts a method read by TypeScript',
    code: component(`private used(): void {} ngOnInit(): void { this.used(); }`)
  }
];

const data = { name: 'value' };
const unusedValue: RuleTester.TestCaseError = {
  messageId: 'unusedField',
  data
};
const errors = [unusedValue];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'does not count this inside a nested normal function as a component field read',
    code: component(
      `private value = ''; public read(): string { function nested(): string { return this.value; } return nested(); }`,
      `template: '{{ read() }}'`
    ),
    errors
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
