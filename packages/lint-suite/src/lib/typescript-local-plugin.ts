import { arrowBodyFitsLineRule } from '@lint-suite/eslint-plugin-arrow-body-fits-line';
import { chainFitsLineRule } from '@lint-suite/eslint-plugin-chain-fits-line';
import { chainReceiverIsNameRule } from '@lint-suite/eslint-plugin-chain-receiver-is-name';
import { explicitAccessibilityRule } from '@lint-suite/eslint-plugin-explicit-accessibility';
import { maxConditionOperandsRule } from '@lint-suite/eslint-plugin-max-condition-operands';
import { noCallInConditionRule } from '@lint-suite/eslint-plugin-no-call-in-condition';
import { noGroupedConditionRule } from '@lint-suite/eslint-plugin-no-grouped-condition';
import { noInlineObjectTypesRule } from '@lint-suite/eslint-plugin-no-inline-object-types';
import { noInlineReturnObjectRule } from '@lint-suite/eslint-plugin-no-inline-return-object';
import { noNestedObjectValueRule } from '@lint-suite/eslint-plugin-no-nested-object-value';
import { noSpreadExpressionRule } from '@lint-suite/eslint-plugin-no-spread-expression';
import { noUnusedExportsRule } from '@lint-suite/eslint-plugin-no-unused-exports';
import { oneLineGuardRule } from '@lint-suite/eslint-plugin-one-line-guard';
import { readonlyTypePropertiesRule } from '@lint-suite/eslint-plugin-readonly-type-properties';
import { ternaryBranchShapeRule } from '@lint-suite/eslint-plugin-ternary-branch-shape';
import { testFileShapeRule } from '@lint-suite/eslint-plugin-test-file-shape';
import { typePlacementRule } from '@lint-suite/eslint-plugin-type-placement';
import { utilPurityRule } from '@lint-suite/eslint-plugin-util-purity';
import type { CompatiblePlugin } from 'typescript-eslint';

const meta = { name: 'local' };
const rules = {
  'arrow-body-fits-line': arrowBodyFitsLineRule,
  'chain-fits-line': chainFitsLineRule,
  'chain-receiver-is-name': chainReceiverIsNameRule,
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
