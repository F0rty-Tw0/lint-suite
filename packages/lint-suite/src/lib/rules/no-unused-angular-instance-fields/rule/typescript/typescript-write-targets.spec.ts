import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const acceptsCompoundAssignmentRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by a compound assignment operator',
  code: component(
    `private count = 0; public bump(): void { this.count += 1; }`,
    { metadata: `template: '{{ bump() }}'` }
  )
};

const errors = [unusedFieldError('value')];

const reportsPlainWrite: RuleTester.InvalidTestCase = {
  name: 'does not count a TypeScript write as a read',
  code: component(
    `private value = ''; public update(): void { this.value = 'written'; }`,
    { metadata: `template: '{{ update() }}'` }
  ),
  errors
};

const reportsDeletedField: RuleTester.InvalidTestCase = {
  name: 'does not count a delete target as a read',
  code: component(
    `private value?: string; public drop(): void { delete this.value; }`,
    { metadata: `template: '{{ drop() }}'` }
  ),
  errors
};

const reportsObjectDestructuringWrite: RuleTester.InvalidTestCase = {
  name: 'does not count an object-destructuring assignment as a component field read',
  code: component(
    `private value = ''; public update(source: { value: string }): void { ({ value: this.value } = source); }`,
    { metadata: `template: '{{ update() }}'` }
  ),
  errors
};

const reportsLoopTargetWrite: RuleTester.InvalidTestCase = {
  name: 'does not count a for-of loop target as a component field read',
  code: component(
    `private value = ''; public fill(source: string[]): void { for (this.value of source) {} }`,
    { metadata: `template: '{{ fill([]) }}'` }
  ),
  errors
};

const valid: RuleTester.ValidTestCase[] = [acceptsCompoundAssignmentRead];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsPlainWrite,
  reportsDeletedField,
  reportsObjectDestructuringWrite,
  reportsLoopTargetWrite
];

ruleTester.run(ruleName, rule, { valid, invalid });
