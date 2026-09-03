import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts this.$event in a host action as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': 'this.$event' }`
      )
    },
    {
      name: 'accepts a host action whose nested write reads the component receiver',
      code: component(
        `protected state = { value: false };`,
        `template: '', host: { '(click)': 'state.value = true' }`
      )
    }
  ],
  invalid: [
    {
      name: 'does not count a host action write as a component field read',
      code: component(
        `private value = false;`,
        `template: '', host: { '(click)': 'value = true' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count an Angular template local as a component field read',
      code: component(
        `private item = ''; protected items = input<string[]>([]);`,
        "template: '@for (item of items; track item) { {{ item }} }'",
        'Component, input'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'item' } }]
    },
    {
      name: 'does not count an Angular host action event local as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': '$event.stopPropagation()' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: '$event' } }]
    }
  ]
});
