import { join } from 'node:path';

import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.js';
import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.js';

const externalComponentFilename = join(
  fixtureDirectory('external-template'),
  'external.component.ts'
);

const acceptsInlineTemplateFieldRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by an inline template',
  code: component(
    `protected fromTemplate = 'used';`,
    `template: '{{ fromTemplate }}'`
  )
};

const acceptsExternalTemplateFieldRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by an external template',
  filename: externalComponentFilename,
  code: component(
    `protected fromTemplate = 'used';`,
    `templateUrl: './external.component.html'`
  )
};

const acceptsHostExpressionFieldReads: RuleTester.ValidTestCase = {
  name: 'accepts fields read by host property and event expressions',
  code: component(
    `protected title = 'used'; protected callback = () => undefined;`,
    `template: '', host: { '[attr.title]': 'title', '(click)': 'callback()' }`
  )
};

const acceptsInlineTemplateMethodRead: RuleTester.ValidTestCase = {
  name: 'accepts a method read by an inline template',
  code: component(
    `private fromTemplate(): string { return 'used'; }`,
    `template: '{{ fromTemplate() }}'`
  )
};

const acceptsHostExpressionMethodRead: RuleTester.ValidTestCase = {
  name: 'accepts a method read by a host expression',
  code: component(
    `protected onClick(): void {}`,
    `template: '', host: { '(click)': 'onClick()' }`
  )
};

const reportsFieldUnreadByHostAndTemplate: RuleTester.InvalidTestCase = {
  name: 'reports only a field unread by both host and template',
  code: component(
    `private hostRead = ''; private templateRead = ''; private unused = '';`,
    `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
  ),
  errors: [unusedFieldError('unused')]
};

const valid: RuleTester.ValidTestCase[] = [
  acceptsInlineTemplateFieldRead,
  acceptsExternalTemplateFieldRead,
  acceptsHostExpressionFieldReads,
  acceptsInlineTemplateMethodRead,
  acceptsHostExpressionMethodRead
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsFieldUnreadByHostAndTemplate
];

ruleTester.run(ruleName, rule, { valid, invalid });
