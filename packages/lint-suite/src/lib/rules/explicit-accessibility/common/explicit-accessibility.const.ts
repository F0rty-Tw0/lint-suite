import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type {
  Accessibility,
  MessageIds,
  Options
} from './explicit-accessibility.type.ts';

export const accessibilities: readonly Accessibility[] = [
  'public',
  'private',
  'protected'
];

const docs: TSESLint.RuleMetaDataDocs = {
  description: 'Require explicit accessibility modifiers on class members'
};

const messages: Record<MessageIds, string> = {
  missingAccessibility:
    "Class member '{{ name }}' is missing an explicit accessibility modifier (public/private/protected).",
  setAccessibility: "Add the '{{ accessibility }}' modifier."
};

const defaultAccessibilitySchema: JSONSchema.JSONSchema4 = {
  type: 'string',
  enum: ['public', 'private', 'protected', 'none'],
  description:
    "The accessibility modifier inserted by the auto-fix; constructors always get public. 'none' reports without an auto-fix and offers all three levels as suggestions."
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  defaultAccessibility: defaultAccessibilitySchema
};

const optionsSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties,
  additionalProperties: false
};

const schema: JSONSchema.JSONSchema4[] = [optionsSchema];

export const meta: ESLintUtils.NamedCreateRuleMeta<
  MessageIds,
  unknown,
  Options
> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  hasSuggestions: true,
  schema,
  messages
};

export const defaultOptions: Options = [{ defaultAccessibility: 'public' }];
