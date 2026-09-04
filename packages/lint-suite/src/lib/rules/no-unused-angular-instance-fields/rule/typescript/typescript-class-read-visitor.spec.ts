import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';

const acceptsClassTypeScriptRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by class TypeScript',
  code: component(
    `private value = 'used'; public read(): string { return this.value; }`,
    { metadata: `template: '{{ read() }}'` }
  )
};

const acceptsMethodTypeScriptRead: RuleTester.ValidTestCase = {
  name: 'accepts a method read by TypeScript',
  code: component(`private used(): void {} ngOnInit(): void { this.used(); }`)
};

const valid: RuleTester.ValidTestCase[] = [
  acceptsClassTypeScriptRead,
  acceptsMethodTypeScriptRead
];

const invalid: RuleTester.InvalidTestCase[] = [];

ruleTester.run(ruleName, rule, { valid, invalid });
