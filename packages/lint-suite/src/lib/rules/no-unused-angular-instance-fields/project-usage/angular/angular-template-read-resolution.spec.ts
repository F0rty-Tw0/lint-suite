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

const unreadLabelError = memberError('unusedField', 'unreadLabel');
const elementReferenceCase = projectInvalidCase(
  'resolves an element reference with no exportAs through the selector matcher',
  discoveryDirectory,
  'element-reference.component.ts',
  [unreadLabelError]
);

const unreadStateError = memberError('unusedField', 'unreadState');
const exportAsReferenceCase = projectInvalidCase(
  'resolves an exportAs template reference to its directive',
  discoveryDirectory,
  'chain.directive.ts',
  [unreadStateError]
);

const invalid = [elementReferenceCase, exportAsReferenceCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
