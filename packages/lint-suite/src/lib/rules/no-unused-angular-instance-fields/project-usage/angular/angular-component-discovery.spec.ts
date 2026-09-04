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
