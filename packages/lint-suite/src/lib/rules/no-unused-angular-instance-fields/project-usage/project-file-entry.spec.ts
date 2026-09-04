import { fixtureDirectory } from '../utils/fixture-project.spec.util.ts';
import {
  projectRuleTester,
  rule,
  ruleName
} from '../utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from './utils/project-analysis-case.spec.util.ts';

const projectDirectory = fixtureDirectory('project-usage');
const projectTester = projectRuleTester(projectDirectory);

const unreadInProjectError = memberError('unusedField', 'unreadInProject');
const unreadFieldsCase = projectInvalidCase(
  'reports unread fields after a successful project analysis',
  projectDirectory,
  'project-unread.component.ts',
  [unreadInProjectError]
);

const invalid = [unreadFieldsCase];

projectTester.run(ruleName, rule, { valid: [], invalid });
