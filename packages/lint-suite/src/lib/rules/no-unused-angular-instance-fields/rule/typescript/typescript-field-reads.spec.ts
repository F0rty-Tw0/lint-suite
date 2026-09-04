import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const acceptsNonNullThisReceiver: RuleTester.ValidTestCase = {
  name: 'accepts a field read through a non-null this receiver',
  code: component(
    `private value = 'used'; public read(): string { return this!.value; }`,
    { metadata: `template: '{{ read() }}'` }
  )
};

const acceptsObjectDestructuringRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read through object destructuring from this',
  code: component(
    `private value = 'used'; public read(): string { const { value } = this; return value; }`,
    { metadata: `template: '{{ read() }}'` }
  )
};

const errors = [unusedFieldError('value')];

const reportsForeignObjectRead: RuleTester.InvalidTestCase = {
  name: 'does not count a foreign object member read as a component field read',
  code: component(
    `private value = ''; public read(other: { value: string }): string { return other.value; }`,
    { metadata: `template: '{{ read() }}'` }
  ),
  errors
};

const valid: RuleTester.ValidTestCase[] = [
  acceptsNonNullThisReceiver,
  acceptsObjectDestructuringRead
];

const invalid: RuleTester.InvalidTestCase[] = [reportsForeignObjectRead];

ruleTester.run(ruleName, rule, { valid, invalid });
