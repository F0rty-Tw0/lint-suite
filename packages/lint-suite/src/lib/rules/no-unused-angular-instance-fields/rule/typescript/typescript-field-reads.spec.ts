import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a field read through a non-null this receiver',
      code: component(
        `private value = 'used'; public read(): string { return this!.value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read by a compound assignment operator',
      code: component(
        `private count = 0; public bump(): void { this.count += 1; }`,
        `template: '{{ bump() }}'`
      )
    }
  ],
  invalid: [
    {
      name: 'does not count a TypeScript write as a read',
      code: component(
        `private value = ''; public update(): void { this.value = 'written'; }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count a foreign object member read as a component field read',
      code: component(
        `private value = ''; public read(other: { value: string }): string { return other.value; }`,
        `template: '{{ read() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count an object-destructuring assignment as a component field read',
      code: component(
        `private value = ''; public update(source: { value: string }): void { ({ value: this.value } = source); }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count a for-of loop target as a component field read',
      code: component(
        `private value = ''; public fill(source: string[]): void { for (this.value of source) {} }`,
        `template: '{{ fill([]) }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    }
  ]
});
