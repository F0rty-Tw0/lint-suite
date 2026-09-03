import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after } from 'node:test';

import {
  component,
  rule,
  ruleName,
  ruleTester
} from './no-unused-instance-fields.spec-support.js';

const externalTemplateDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-')
);
const externalComponentFilename = join(
  externalTemplateDirectory,
  'external.component.ts'
);

writeFileSync(
  join(externalTemplateDirectory, 'external.component.html'),
  '{{ fromTemplate }}'
);
after(() =>
  rmSync(externalTemplateDirectory, { force: true, recursive: true })
);

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a field read by an inline template',
      code: component(
        `protected fromTemplate = 'used';`,
        `template: '{{ fromTemplate }}'`
      )
    },
    {
      name: 'accepts a field read by an external template',
      filename: externalComponentFilename,
      code: component(
        `protected fromTemplate = 'used';`,
        `templateUrl: './external.component.html'`
      )
    },
    {
      name: 'accepts fields read by host property and event expressions',
      code: component(
        `protected title = 'used'; protected callback = () => undefined;`,
        `template: '', host: { '[attr.title]': 'title', '(click)': 'callback()' }`
      )
    },
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
    },
    {
      name: 'accepts a method read by an inline template',
      code: component(
        `private fromTemplate(): string { return 'used'; }`,
        `template: '{{ fromTemplate() }}'`
      )
    },
    {
      name: 'accepts a method read by a host expression',
      code: component(
        `protected onClick(): void {}`,
        `template: '', host: { '(click)': 'onClick()' }`
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
      name: 'reports only a field unread by both host and template',
      code: component(
        `private hostRead = ''; private templateRead = ''; private unused = '';`,
        `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
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
