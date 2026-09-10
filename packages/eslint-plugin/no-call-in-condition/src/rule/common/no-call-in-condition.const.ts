import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type {
  MessageIds,
  Options,
  RuleOptions
} from './no-call-in-condition.type.ts';

export const PREDICATE_PATTERNS: string[] = ['^(is|has)[A-Z]'];

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Disallow a function call inside an if condition or a boolean const that feeds one'
};

const messages: Record<MessageIds, string> = {
  callInCondition:
    "Call '{{ callee }}' decides inside a condition; assign it to a named const first.",
  hoistCall: "Assign the call to '{{ name }}' above the statement."
};

const patternSchema: JSONSchema.JSONSchema4 = { type: 'string' };

const allowPredicatesSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: patternSchema,
  description:
    'Regular expression sources for callee names treated as type predicates when no TypeScript program is available.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  allowPredicates: allowPredicatesSchema
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

const ruleDefaults: RuleOptions = {
  allowPredicates: PREDICATE_PATTERNS
};

export const defaultOptions: Options = [ruleDefaults];
