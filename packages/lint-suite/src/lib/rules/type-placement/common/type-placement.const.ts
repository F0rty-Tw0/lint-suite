import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type { MessageIds, Options } from './type-placement.type.ts';

const DEFAULT_INTERNAL_PATTERNS: string[] = [];

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require types to live in common/*.type.ts files, *.const.ts files to export only consts, and type-only imports to come from *.type.ts files'
};

const messages: Record<MessageIds, string> = {
  typeOutsideTypeFile:
    "Exported type '{{ name }}' belongs in a common/*.type.ts file, not here.",
  valueInTypeFile:
    'A *.type.ts file may only export type aliases and interfaces.',
  nonConstInConstFile:
    'A *.const.ts file may only export const variable declarations.',
  typeImportNotFromTypeFile:
    "Type-only import from '{{ source }}' must come from a *.type.ts file."
};

const stringItems: JSONSchema.JSONSchema4 = { type: 'string' };

const internalPatternsSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringItems,
  description:
    'Regular expressions matching internal, non-relative import sources that must point at a *.type.ts file. Empty by default: a workspace alias resolves to a library entry point, never to a type file.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  internalPatterns: internalPatternsSchema
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
  type: 'problem',
  docs,
  schema,
  messages
};

export const defaultOptions: Options = [
  { internalPatterns: DEFAULT_INTERNAL_PATTERNS }
];
