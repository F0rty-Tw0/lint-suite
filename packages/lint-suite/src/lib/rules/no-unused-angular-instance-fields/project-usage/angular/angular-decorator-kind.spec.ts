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

const unreadAliasError = memberError('unusedField', 'unreadAlias');
const aliasedDecoratorCase = projectInvalidCase(
  'reports only the member unread by a template behind aliased and namespaced decorators',
  discoveryDirectory,
  'aliased-decorator.directive.ts',
  [unreadAliasError]
);

const invalid = [aliasedDecoratorCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
