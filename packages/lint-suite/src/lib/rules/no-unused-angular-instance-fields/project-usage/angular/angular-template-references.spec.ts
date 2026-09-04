import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../../utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../utils/project-analysis-case.spec.util.ts';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

const unreadStateError = memberError('unusedField', 'unreadState');
const exportAsReferenceCase = projectInvalidCase(
  'resolves an exportAs template reference to its directive',
  discoveryDirectory,
  'chain.directive.ts',
  [unreadStateError]
);

const invalid = [exportAsReferenceCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
