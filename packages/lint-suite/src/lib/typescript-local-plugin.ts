import { definePlugin } from './rules/define-plugin.util.ts';
import explicitAccessibilityRule from './rules/explicit-accessibility/explicit-accessibility.ts';
import noInlineObjectTypesRule from './rules/no-inline-object-types/no-inline-object-types.ts';
import readonlyTypePropertiesRule from './rules/readonly-type-properties/readonly-type-properties.ts';

export const localPlugin = definePlugin('local', {
  'explicit-accessibility': explicitAccessibilityRule,
  'readonly-type-properties': readonlyTypePropertiesRule,
  'no-inline-object-types': noInlineObjectTypesRule
});
