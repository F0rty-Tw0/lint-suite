import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from './test/utils/project-analysis-case.spec.util.ts';

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
