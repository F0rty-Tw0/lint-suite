import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.js';
import {
  memberError,
  projectInvalidCase
} from '../utils/project-analysis-case.spec.util.js';

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
