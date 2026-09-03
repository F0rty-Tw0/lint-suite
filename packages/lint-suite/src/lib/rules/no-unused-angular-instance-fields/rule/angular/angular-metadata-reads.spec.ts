import { join } from 'node:path';

import { component } from '../../utils/component-source.spec.util.js';
import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

const externalComponentFilename = join(
  fixtureDirectory('external-template'),
  'external.component.ts'
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
      name: 'reports only a field unread by both host and template',
      code: component(
        `private hostRead = ''; private templateRead = ''; private unused = '';`,
        `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    }
  ]
});
