import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const acceptsComputedMetadataKey: RuleTester.ValidTestCase = {
  name: 'bails out of metadata holding a computed key',
  code: component(`private unused = '';`, {
    metadata: `['tem' + 'plate']: ''`
  })
};

const errors = [unusedFieldError('unused')];

const readsTemplateUnderQuotedKey: RuleTester.InvalidTestCase = {
  name: 'reads a template declared under a quoted metadata key',
  code: component(`private used = ''; private unused = '';`, {
    metadata: `'template': '{{ used }}'`
  }),
  errors
};

const readsTemplateLiteralTemplate: RuleTester.InvalidTestCase = {
  name: 'reads a template declared as a template literal',
  code: component(`private used = ''; private unused = '';`, {
    metadata: 'template: `{{ used }}`'
  }),
  errors
};

const valid: RuleTester.ValidTestCase[] = [acceptsComputedMetadataKey];

const invalid: RuleTester.InvalidTestCase[] = [
  readsTemplateUnderQuotedKey,
  readsTemplateLiteralTemplate
];

ruleTester.run(ruleName, rule, { valid, invalid });
