import { builtinModules } from 'node:module';
import { dirname, resolve } from 'node:path';

import { projectForFile } from '../workspace-model.ts';
import { matchImportWithWildcard } from './tag-patterns.util.ts';

import type {
  PathAlias,
  Project,
  Target,
  WorkspaceModel
} from '../common/modular-boundaries.type.ts';

type AliasMatch = { readonly prefixLength: number; readonly path: string };

const SKIP: Target = { kind: 'skip' };
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const NPM_SPECIFIER = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(\/.*)?$/i;

const isAllowed = (specifier: string, allow: string[] | undefined): boolean => {
  const matches = (pattern: string): boolean => {
    return matchImportWithWildcard(pattern, specifier);
  };

  return allow?.some(matches) ?? false;
};

const isNodeBuiltin = (specifier: string): boolean => {
  return specifier.startsWith('node:') || builtinModules.includes(specifier);
};

const packageNameOf = (specifier: string): string => {
  const segments = specifier.split('/');
  const count = specifier.startsWith('@') ? 2 : 1;

  return segments.slice(0, count).join('/');
};

const projectTarget = (
  project: Project | undefined,
  via: 'relative' | 'package' | 'alias'
): Target => {
  if (project === undefined) return SKIP;

  const target: Target = { kind: 'project', project, via };

  return target;
};

const matchWildcardAlias = (
  alias: PathAlias,
  specifier: string
): AliasMatch[] => {
  const [prefix = '', suffix, ...rest] = alias.pattern.split('*');
  const isSingleWildcard = suffix !== undefined && rest.length === 0;

  if (!isSingleWildcard) return [];

  const isLongEnough = specifier.length >= prefix.length + suffix.length;
  const hasPrefix = specifier.startsWith(prefix);
  const hasSuffix = specifier.endsWith(suffix);

  if (!isLongEnough || !hasPrefix || !hasSuffix) return [];

  const end = specifier.length - suffix.length;
  const captured = specifier.slice(prefix.length, end);
  const path = alias.target.replace('*', () => captured);
  const match: AliasMatch = { prefixLength: prefix.length, path };

  return [match];
};

/** TypeScript `paths` semantics: an exact key wins, then the longest prefix. */
const aliasPathFor = (
  aliases: PathAlias[],
  specifier: string
): string | undefined => {
  const exact = aliases.find((alias) => alias.pattern === specifier);

  if (exact !== undefined) return exact.target;

  const toMatches = (alias: PathAlias): AliasMatch[] => {
    return matchWildcardAlias(alias, specifier);
  };
  const matches = aliases.flatMap(toMatches);
  let best: AliasMatch | undefined;

  for (const match of matches) {
    const isLonger =
      best === undefined || match.prefixLength > best.prefixLength;

    if (isLonger) best = match;
  }

  return best?.path;
};

/**
 * Classifies an import specifier of `sourceFile` as a workspace `project`, an
 * `npm` package, or `skip`, by the first matching resolution step (README § Checks).
 * `allow` undefined skips the allow step (project-graph use).
 */
export const resolveTarget = (
  specifier: string,
  sourceFile: string,
  model: WorkspaceModel,
  allow: string[] | undefined
): Target => {
  const isAllowedSpecifier = isAllowed(specifier, allow);
  const isBuiltin = isNodeBuiltin(specifier);
  const isSubpathImport = specifier.startsWith('#');
  const hasScheme = URL_SCHEME.test(specifier);
  const isIgnored =
    isAllowedSpecifier || isBuiltin || isSubpathImport || hasScheme;

  if (isIgnored) return SKIP;

  const isPath = specifier.startsWith('.') || specifier.startsWith('/');

  if (isPath) {
    const path = resolve(dirname(sourceFile), specifier);
    const project = projectForFile(model, path);

    return projectTarget(project, 'relative');
  }

  const name = packageNameOf(specifier);
  const workspacePackage = model.projectByPackageName.get(name);

  if (workspacePackage) return projectTarget(workspacePackage, 'package');

  const aliasPath = aliasPathFor(model.pathAliases, specifier);

  if (aliasPath !== undefined) {
    const project = projectForFile(model, aliasPath);

    return projectTarget(project, 'alias');
  }

  const isNpm = NPM_SPECIFIER.test(specifier);

  if (!isNpm) return SKIP;

  const target: Target = { kind: 'npm', name, specifier };

  return target;
};
