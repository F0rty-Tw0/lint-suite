import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type {
  MessageIds,
  Options,
  RuleOptions
} from './no-unused-exports.type.ts';

// eslint-disable-next-line local/no-unused-exports -- read by eslint.config.ts
export const entryPointDefaults: string[] = [
  '**/main.ts',
  '**/main.*.ts',
  '**/public-api.ts',
  '**/index.ts',
  '**/*.config.ts',
  '**/*.config.mts',
  '**/*.config.cts',
  '**/*.spec.ts',
  '**/*.spec.util.ts',
  '**/*.stub.ts',
  '**/*.mock.ts',
  '**/*.d.ts',
  '**/*.stories.ts',
  '**/environment*.ts'
];

export const STAR_NAME = '*';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Disallow exports that no other file in the TypeScript program imports'
};

const messages: Record<MessageIds, string> = {
  unusedExport: "Export '{{ name }}' is never imported by another file.",
  unusedModule: 'This module exports names but is never imported.'
};

const entryPointItemsSchema: JSONSchema.JSONSchema4 = { type: 'string' };

const entryPointsSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: entryPointItemsSchema,
  description: 'Globs whose files are treated as project entry points.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  entryPoints: entryPointsSchema
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

const ruleDefaults: RuleOptions = { entryPoints: [...entryPointDefaults] };

export const defaultOptions: Options = [ruleDefaults];
