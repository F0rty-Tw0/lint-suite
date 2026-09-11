import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../test/utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project');
const projectTester = projectRuleTester(projectDirectory);

const leftoverError = memberError('unusedField', 'leftover');
const helperError = memberError('unusedMethod', 'helper');
const unreadMembersCase = projectInvalidCase(
  'reports unread members of a component discovered in project mode',
  projectDirectory,
  'src/unread-members.component.ts',
  [leftoverError, helperError]
);

const exposedError = memberError('unusedField', 'exposed');
const unreadPublicCase = projectInvalidCase(
  'reports an unread public field of a directive discovered in project mode',
  projectDirectory,
  'src/unread-public.directive.ts',
  [exposedError]
);

const invalid = [unreadMembersCase, unreadPublicCase];

projectTester.run(ruleName, rule, { valid: [], invalid });
