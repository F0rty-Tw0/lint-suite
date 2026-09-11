import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type { MessageIds, Options } from './no-nested-object-value.type.ts';

const DEFAULT_CONFIG_FILES: string[] = [
  '**/*.config.{ts,js,mjs,cjs}',
  '**/eslint.config.*',
  '**/*.schema.ts'
];

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a nested object literal, array of objects, conditional, or chained call used as a property value to be named as a constant first'
};

const messages: Record<MessageIds, string> = {
  nestedValue:
    "Property '{{ key }}' holds a nested value inline; name it as a constant first."
};

const configFilesItemsSchema: JSONSchema.JSONSchema4 = { type: 'string' };

const configFilesSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: configFilesItemsSchema
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  configFiles: configFilesSchema
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
  hasSuggestions: true,
  schema,
  messages
};

export const defaultOptions: Options = [{ configFiles: DEFAULT_CONFIG_FILES }];
