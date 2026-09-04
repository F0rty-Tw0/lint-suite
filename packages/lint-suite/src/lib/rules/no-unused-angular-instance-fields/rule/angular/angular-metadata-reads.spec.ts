import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';

const reportsFieldUnreadByHostAndTemplate: RuleTester.InvalidTestCase = {
  name: 'reports only a field unread by both host and template',
  code: component(
    `private hostRead = ''; private templateRead = ''; private unused = '';`,
    {
      metadata: `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
    }
  ),
  errors: [unusedFieldError('unused')]
};

const valid: RuleTester.ValidTestCase[] = [];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsFieldUnreadByHostAndTemplate
];

ruleTester.run(ruleName, rule, { valid, invalid });
