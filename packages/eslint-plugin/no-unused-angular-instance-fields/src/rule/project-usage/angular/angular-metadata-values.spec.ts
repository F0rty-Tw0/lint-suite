import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../test/utils/project-analysis-case.spec.util.ts';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

const unreadConstantError = memberError('unusedField', 'unreadConstant');
const constantExportAsCase = projectInvalidCase(
  'reads a directive member through an exportAs given as a constant',
  discoveryDirectory,
  'constant-metadata.directive.ts',
  [unreadConstantError]
);

const missingFromTemplateError = memberError(
  'unusedField',
  'missingFromTemplate'
);
const constantTemplateUrlCase = projectInvalidCase(
  'reports a member missing from a template whose templateUrl is a constant',
  discoveryDirectory,
  'constant-metadata.host.component.ts',
  [missingFromTemplateError]
);

const invalid = [constantExportAsCase, constantTemplateUrlCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
