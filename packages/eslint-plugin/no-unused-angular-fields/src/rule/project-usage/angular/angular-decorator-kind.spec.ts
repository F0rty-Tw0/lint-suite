import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../test/utils/project-analysis-case.spec.util.ts';

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
