import { projectRuleTester } from '@lint-suite/rule-test-support/utils/project-rule-tester.spec.util.ts';
import { fixtureDirectory } from '../../test/utils/fixture-project.spec.util.ts';
import { rule, ruleName } from '../../test/utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from '../test/utils/project-analysis-case.spec.util.ts';

const discoveryDirectory = fixtureDirectory('project-discovery');
const discoveryTester = projectRuleTester(discoveryDirectory);

const unreadInScopeError = memberError('unusedField', 'unreadInScope');
const inScopeCase = projectInvalidCase(
  'reads a directive member through a reference inside the standalone imports scope',
  discoveryDirectory,
  'scoped-dual.in-scope.directive.ts',
  [unreadInScopeError]
);

const valueError = memberError('unusedField', 'value');
const outOfScopeCase = projectInvalidCase(
  'reports a directive member whose exportAs twin is outside the standalone imports scope',
  discoveryDirectory,
  'scoped-dual.out-of-scope.directive.ts',
  [valueError]
);

const invalid = [inScopeCase, outOfScopeCase];

discoveryTester.run(ruleName, rule, { valid: [], invalid });
