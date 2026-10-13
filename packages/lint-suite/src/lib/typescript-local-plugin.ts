import { arrowFitsLineRule } from '@lint-suite/eslint-arrow-fits-line';
import { chainFitsLineRule } from '@lint-suite/eslint-chain-fits-line';
import { chainReceiverNameRule } from '@lint-suite/eslint-chain-receiver-name';
import { explicitAccessibilityRule } from '@lint-suite/eslint-explicit-accessibility';
import { maxConditionOperandsRule } from '@lint-suite/eslint-max-condition-operands';
import { noCallInConditionRule } from '@lint-suite/eslint-no-call-in-condition';
import { noGroupedConditionRule } from '@lint-suite/eslint-no-grouped-condition';
import { noInlineObjectTypesRule } from '@lint-suite/eslint-no-inline-object-types';
import { noInlineReturnObjectRule } from '@lint-suite/eslint-no-inline-return-object';
import { noNestedObjectValueRule } from '@lint-suite/eslint-no-nested-object-value';
import { noSpreadExpressionRule } from '@lint-suite/eslint-no-spread-expression';
import { noUnusedExportsRule } from '@lint-suite/eslint-no-unused-exports';
import { oneLineGuardRule } from '@lint-suite/eslint-one-line-guard';
import { readonlyTypePropertiesRule } from '@lint-suite/eslint-readonly-type-properties';
import { ternaryBranchShapeRule } from '@lint-suite/eslint-ternary-branch-shape';
import { testFileShapeRule } from '@lint-suite/eslint-test-file-shape';
import { typePlacementRule } from '@lint-suite/eslint-type-placement';
import { utilPurityRule } from '@lint-suite/eslint-util-purity';
import type { CompatiblePlugin } from 'typescript-eslint';

const meta = { name: 'local' };
const rules = {
  'arrow-fits-line': arrowFitsLineRule,
  'chain-fits-line': chainFitsLineRule,
  'chain-receiver-name': chainReceiverNameRule,
  'explicit-accessibility': explicitAccessibilityRule,
  'max-condition-operands': maxConditionOperandsRule,
  'no-call-in-condition': noCallInConditionRule,
  'no-grouped-condition': noGroupedConditionRule,
  'no-inline-object-types': noInlineObjectTypesRule,
  'no-inline-return-object': noInlineReturnObjectRule,
  'no-nested-object-value': noNestedObjectValueRule,
  'no-spread-expression': noSpreadExpressionRule,
  'no-unused-exports': noUnusedExportsRule,
  'one-line-guard': oneLineGuardRule,
  'readonly-type-properties': readonlyTypePropertiesRule,
  'ternary-branch-shape': ternaryBranchShapeRule,
  'test-file-shape': testFileShapeRule,
  'type-placement': typePlacementRule,
  'util-purity': utilPurityRule
};
const plugin = { meta, rules };

export const localPlugin: CompatiblePlugin = plugin;
