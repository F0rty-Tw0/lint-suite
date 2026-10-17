import type { RuleTester } from 'eslint';

import { LOCAL_ANALYSIS_OPTIONS_STUB } from '../../test/stubs/local-analysis-options.stub.ts';
import { component } from '../../test/utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../test/utils/unused-member-error.spec.util.ts';

const reportsFieldUnreadByHostAndTemplate: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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
