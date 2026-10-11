import type { MessageIds } from './modular-boundaries.type.ts';

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

export const messages: Record<MessageIds, string> = {
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
