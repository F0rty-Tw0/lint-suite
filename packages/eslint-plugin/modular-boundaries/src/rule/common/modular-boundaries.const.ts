import type {
  ESLintUtils,
  JSONSchema,
  TSESLint
} from '@typescript-eslint/utils';

import type {
  MessageIds,
  Options,
  RuleOptions
} from './modular-boundaries.type.ts';

/**
 * Workspace root markers, in check order. `package.json` counts only with a
 * `workspaces` field, `turbo.json` only without `extends`, and a nested
 * `.moon/workspace.yml` marks the parent of `.moon`.
 */
export const ROOT_MARKERS: string[] = [
  'pnpm-workspace.yaml',
  'package.json',
  'nx.json',
  'turbo.json',
  '.moon/workspace.yml'
];

export const MANIFEST_NAMES: string[] = [
  'package.json',
  'project.json',
  'moon.yml'
];

export const SOURCE_EXTENSIONS: string[] = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs'
];

export const STALE_AFTER_MS = 10_000;

const messages: Record<MessageIds, string> = {
  noRelativeOrAbsoluteImportsAcrossLibraries:
    "Projects should use the package name or path alias to import '{{target}}' from '{{source}}', not a relative path.",
  noSelfCircularDependencies:
    "'{{source}}' imports itself through '{{specifier}}'; use a relative import.",
  bannedExternalImportsViolation:
    "'{{specifier}}' is banned for '{{source}}' by {{origin}}.",
  undeclaredDependency:
    "'{{name}}' is imported by '{{source}}' but not declared in its package.json.",
  noCircularDependencies:
    "Circular dependency between '{{source}}' and '{{target}}': {{path}}.",
  projectWithoutTagsCannotHaveDependencies:
    "'{{source}}' matches no dependency constraint, so it cannot import '{{target}}'.",
  onlyTagsConstraintViolation:
    "'{{source}}' cannot import '{{target}}': {{side}} project '{{project}}' must carry one of {{tags}} ({{origin}}).",
  emptyOnlyTagsConstraintViolation:
    "'{{source}}' cannot import '{{target}}': an empty allow list forbids this dependency ({{origin}}).",
  notTagsConstraintViolation:
    "'{{source}}' cannot import '{{target}}': {{side}} project '{{project}}' must not carry any of {{tags}} ({{origin}}).",
  workspaceConfigError: 'Workspace config error in {{file}}: {{message}}'
};

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Enforce dependency constraints between workspace projects by tag, without Nx'
};

const stringSchema: JSONSchema.JSONSchema4 = { type: 'string' };

const stringArraySchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringSchema
};

const booleanSchema: JSONSchema.JSONSchema4 = { type: 'boolean' };

const depConstraintProperties: Record<string, JSONSchema.JSONSchema4> = {
  sourceTag: stringSchema,
  allSourceTags: stringArraySchema,
  onlyDependOnLibsWithTags: stringArraySchema,
  notDependOnLibsWithTags: stringArraySchema,
  allowedExternalImports: stringArraySchema,
  bannedExternalImports: stringArraySchema
};

const hasSourceTag: JSONSchema.JSONSchema4 = {
  type: 'object',
  required: ['sourceTag']
};

const hasAllSourceTags: JSONSchema.JSONSchema4 = {
  type: 'object',
  required: ['allSourceTags']
};

const depConstraintSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties: depConstraintProperties,
  additionalProperties: false,
  oneOf: [hasSourceTag, hasAllSourceTags]
};

const depConstraintsSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: depConstraintSchema
};

const projectPairSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringSchema,
  minItems: 2,
  maxItems: 2
};

const ignoredCircularDependenciesSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: projectPairSchema
};

const configSourcesProperties: Record<string, JSONSchema.JSONSchema4> = {
  turbo: booleanSchema,
  moon: booleanSchema
};

const configSourcesSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties: configSourcesProperties,
  additionalProperties: false
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  allow: stringArraySchema,
  depConstraints: depConstraintsSchema,
  ignoredCircularDependencies: ignoredCircularDependenciesSchema,
  checkCircularDependencies: booleanSchema,
  checkUndeclaredDependencies: booleanSchema,
  configSources: configSourcesSchema,
  workspaceRoot: stringSchema
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

const ruleDefaults: RuleOptions = {};

export const defaultOptions: Options = [ruleDefaults];
