import arrowBodyFitsLineRule from './rules/arrow-body-fits-line/arrow-body-fits-line.ts';
import chainFitsLineRule from './rules/chain-fits-line/chain-fits-line.ts';
import chainReceiverIsNameRule from './rules/chain-receiver-is-name/chain-receiver-is-name.ts';
import { definePlugin } from './rules/define-plugin.util.ts';
import explicitAccessibilityRule from './rules/explicit-accessibility/explicit-accessibility.ts';
import maxConditionOperandsRule from './rules/max-condition-operands/max-condition-operands.ts';
import noCallInConditionRule from './rules/no-call-in-condition/no-call-in-condition.ts';
import noGroupedConditionRule from './rules/no-grouped-condition/no-grouped-condition.ts';
import noInlineObjectTypesRule from './rules/no-inline-object-types/no-inline-object-types.ts';
import noInlineReturnObjectRule from './rules/no-inline-return-object/no-inline-return-object.ts';
import noNestedObjectValueRule from './rules/no-nested-object-value/no-nested-object-value.ts';
import noSpreadExpressionRule from './rules/no-spread-expression/no-spread-expression.ts';
import noUnusedExportsRule from './rules/no-unused-exports/no-unused-exports.ts';
import oneLineGuardRule from './rules/one-line-guard/one-line-guard.ts';
import readonlyTypePropertiesRule from './rules/readonly-type-properties/readonly-type-properties.ts';
import siblingSpecRule from './rules/sibling-spec/sibling-spec.ts';
import ternaryBranchShapeRule from './rules/ternary-branch-shape/ternary-branch-shape.ts';
import testFileShapeRule from './rules/test-file-shape/test-file-shape.ts';
import typePlacementRule from './rules/type-placement/type-placement.ts';
import utilPurityRule from './rules/util-purity/util-purity.ts';

export const localPlugin = definePlugin('local', {
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
  'sibling-spec': siblingSpecRule,
  'ternary-branch-shape': ternaryBranchShapeRule,
  'test-file-shape': testFileShapeRule,
  'type-placement': typePlacementRule,
  'util-purity': utilPurityRule
});
