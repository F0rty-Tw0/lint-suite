import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const acceptsHostActionEventReceiverRead: RuleTester.ValidTestCase = {
  name: 'accepts this.$event in a host action as a component field read',
  code: component(`private $event = undefined;`, {
    metadata: `template: '', host: { '(click)': 'this.$event' }`
  })
};

const acceptsHostActionNestedWriteReceiver: RuleTester.ValidTestCase = {
  name: 'accepts a host action whose nested write reads the component receiver',
  code: component(`protected state = { value: false };`, {
    metadata: `template: '', host: { '(click)': 'state.value = true' }`
  })
};

const reportsHostActionWriteOnlyField: RuleTester.InvalidTestCase = {
  name: 'does not count a host action write as a component field read',
  code: component(`private value = false;`, {
    metadata: `template: '', host: { '(click)': 'value = true' }`
  }),
  errors: [unusedFieldError('value')]
};

const reportsFieldShadowedByTemplateLocal: RuleTester.InvalidTestCase = {
  name: 'does not count an Angular template local as a component field read',
  code: component(`private item = ''; protected items = input<string[]>([]);`, {
    metadata: "template: '@for (item of items; track item) { {{ item }} }'",
    imports: 'Component, input'
  }),
  errors: [unusedFieldError('item')]
};

const reportsFieldShadowedByHostActionEvent: RuleTester.InvalidTestCase = {
  name: 'does not count an Angular host action event local as a component field read',
  code: component(`private $event = undefined;`, {
    metadata: `template: '', host: { '(click)': '$event.stopPropagation()' }`
  }),
  errors: [unusedFieldError('$event')]
};

const valid: RuleTester.ValidTestCase[] = [
  acceptsHostActionEventReceiverRead,
  acceptsHostActionNestedWriteReceiver
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsHostActionWriteOnlyField,
  reportsFieldShadowedByTemplateLocal,
  reportsFieldShadowedByHostActionEvent
];

ruleTester.run(ruleName, rule, { valid, invalid });
