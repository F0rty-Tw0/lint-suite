import { projectRuleTester } from '../../../test/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../test/utils/project-analysis-case.spec.util.ts';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

const unreadLabelError = memberError('unusedField', 'unreadLabel');
const elementReferenceCase = projectInvalidCase(
  'resolves an element reference with no exportAs through the selector matcher',
  discoveryDirectory,
  'element-reference.component.ts',
  [unreadLabelError]
);

const invalid = [elementReferenceCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
