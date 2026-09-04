import { join } from 'node:path';

import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';

const externalComponentFilename = join(
  fixtureDirectory('external-template'),
  'external.component.ts'
);

const acceptsInlineTemplateFieldRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by an inline template',
  code: component(`protected fromTemplate = 'used';`, {
    metadata: `template: '{{ fromTemplate }}'`
  })
};

const acceptsExternalTemplateFieldRead: RuleTester.ValidTestCase = {
  name: 'accepts a field read by an external template',
  filename: externalComponentFilename,
  code: component(`protected fromTemplate = 'used';`, {
    metadata: `templateUrl: './external.component.html'`
  })
};

const acceptsHostExpressionFieldReads: RuleTester.ValidTestCase = {
  name: 'accepts fields read by host property and event expressions',
  code: component(
    `protected title = 'used'; protected callback = () => undefined;`,
    {
      metadata: `template: '', host: { '[attr.title]': 'title', '(click)': 'callback()' }`
    }
  )
};

const acceptsInlineTemplateMethodRead: RuleTester.ValidTestCase = {
  name: 'accepts a method read by an inline template',
  code: component(`private fromTemplate(): string { return 'used'; }`, {
    metadata: `template: '{{ fromTemplate() }}'`
  })
};

const acceptsHostExpressionMethodRead: RuleTester.ValidTestCase = {
  name: 'accepts a method read by a host expression',
  code: component(`protected onClick(): void {}`, {
    metadata: `template: '', host: { '(click)': 'onClick()' }`
  })
};

const valid: RuleTester.ValidTestCase[] = [
  acceptsInlineTemplateFieldRead,
  acceptsExternalTemplateFieldRead,
  acceptsHostExpressionFieldReads,
  acceptsInlineTemplateMethodRead,
  acceptsHostExpressionMethodRead
];

const invalid: RuleTester.InvalidTestCase[] = [];

ruleTester.run(ruleName, rule, { valid, invalid });
