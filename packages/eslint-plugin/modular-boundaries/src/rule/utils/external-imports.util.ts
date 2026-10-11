import type {
  Constraint,
  EdgeReport,
  Project
} from '../common/modular-boundaries.type.ts';

import { mapGlobToRegExp } from './tag-patterns.util.ts';

const matchesExternal = (patterns: string[], specifier: string): boolean => {
  const matchesPattern = (pattern: string): boolean => {
    const regex = mapGlobToRegExp(pattern);

    return regex.test(specifier);
  };

  return patterns.some(matchesPattern);
};

const isBannedBy = (constraint: Constraint, specifier: string): boolean => {
  const { allowedExternal, bannedExternal = [] } = constraint;
  const isBanned = matchesExternal(bannedExternal, specifier);

  if (isBanned) return true;
  if (!allowedExternal) return false;

  return !matchesExternal(allowedExternal, specifier);
};

/** README § Checks, step 3, against the full import specifier. */
export const bannedExternalReport = (
  matched: Constraint[],
  source: Project,
  specifier: string
): EdgeReport | undefined => {
  const isBanning = (constraint: Constraint): boolean => {
    return isBannedBy(constraint, specifier);
  };
  const banning = matched.find(isBanning);

  if (!banning) return undefined;

  const data = { specifier, source: source.id, origin: banning.origin };
  const report: EdgeReport = {
    messageId: 'bannedExternalImportsViolation',
    data
  };

  return report;
};

/** `@types/x` for `x`, `@types/scope__name` for `@scope/name`. */
export const typesPackageName = (name: string): string => {
  const unscoped = name.startsWith('@') ? name.slice(1) : name;
  const flattened = unscoped.replace('/', '__');

  return `@types/${flattened}`;
};

/** README § Checks, step 4: neither `name` nor its `@types/` name is declared. */
export const undeclaredDependencyReport = (
  source: Project,
  name: string
): EdgeReport | undefined => {
  const declared = source.declaredDependencies;
  const typesName = typesPackageName(name);
  const isDeclared = declared.includes(name) || declared.includes(typesName);

  if (isDeclared) return undefined;

  const data = { name, source: source.id };
  const report: EdgeReport = { messageId: 'undeclaredDependency', data };

  return report;
};
