import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type { MessageIds, Options } from './util-purity.type.ts';

const DEFAULT_BANNED_MODULES: string[] = [
  'node:fs',
  'fs',
  'node:fs/promises',
  'fs/promises',
  'node:child_process',
  'child_process',
  'node:os',
  'os',
  'node:process',
  'process',
  'node:http',
  'http',
  'node:https',
  'https',
  'node:net',
  'net',
  'node:worker_threads',
  'worker_threads'
];

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Disallow impure, I/O-touching, or nondeterministic code inside *.util.ts files'
};

const messages: Record<MessageIds, string> = {
  impureImport:
    "Importing '{{ source }}' makes this util impure; utils must not perform I/O.",
  moduleLet:
    'Module-level `let` creates mutable shared state; utils must be pure.',
  moduleState:
    'Module-level Map/Set/WeakMap/WeakSet is mutable shared state; utils must be pure.',
  ambientAccess:
    "Accessing ambient '{{ name }}' makes this util impure and environment-dependent.",
  nondeterministic:
    "'{{ name }}' is nondeterministic; a util must return the same output for the same input.",
  impureCall: "Calling '{{ name }}' makes this util impure or side-effecting."
};

const stringItems: JSONSchema.JSONSchema4 = { type: 'string' };

const bannedModulesSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringItems,
  description: 'Import sources that are forbidden inside util files.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  bannedModules: bannedModulesSchema
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
  { bannedModules: DEFAULT_BANNED_MODULES }
];

export const MODULE_LET_SELECTOR = 'Program > VariableDeclaration[kind="let"]';

export const MODULE_STATE_SELECTOR =
  'Program > VariableDeclaration > VariableDeclarator > NewExpression[callee.name=/^(Map|Set|WeakMap|WeakSet)$/]';

export const AMBIENT_SELECTOR =
  'MemberExpression[object.name=/^(process|globalThis|window|document|localStorage|sessionStorage|console)$/]';

const NONDETERMINISTIC_SELECTORS: string[] = [
  'MemberExpression[object.name="Date"][property.name="now"]',
  'MemberExpression[object.name="Math"][property.name="random"]',
  'MemberExpression[object.name="performance"][property.name="now"]',
  'MemberExpression[object.name="crypto"][property.name="randomUUID"]'
];

export const NONDETERMINISTIC_SELECTOR = NONDETERMINISTIC_SELECTORS.join(', ');

export const CALL_SELECTOR =
  'CallExpression[callee.name=/^(setTimeout|setInterval|fetch|inject|require)$/]';
