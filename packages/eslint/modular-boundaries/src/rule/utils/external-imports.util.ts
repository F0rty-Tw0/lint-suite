import { globRegExpIn } from './tag-patterns.util.ts';
import type {
  CompiledPatterns,
  Constraint,
  EdgeReport,
  Project
} from '../common/modular-boundaries.type.ts';

const matchesExternal = (
  patterns: string[],
  specifier: string,
  compiled: CompiledPatterns
): boolean => {
  const matchesPattern = (pattern: string): boolean => {
    const regex = globRegExpIn(compiled, pattern);

    return regex.test(specifier);
  };

  return patterns.some(matchesPattern);
};

const isBannedBy = (
  constraint: Constraint,
  specifier: string,
  compiled: CompiledPatterns
): boolean => {
  const { allowedExternal, bannedExternal = [] } = constraint;
  const isBanned = matchesExternal(bannedExternal, specifier, compiled);

  if (isBanned) return true;

  if (!allowedExternal) return false;

  return !matchesExternal(allowedExternal, specifier, compiled);
};

/** README § Checks, step 3, against the full import specifier. */
export const bannedExternalReport = (
  matched: Constraint[],
  source: Project,
  specifier: string,
  compiled: CompiledPatterns
): EdgeReport | undefined => {
  const isBanning = (constraint: Constraint): boolean => {
    return isBannedBy(constraint, specifier, compiled);
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
  const isScoped = name.startsWith('@');
  const withoutAt = name.slice(1);
  const unscoped = isScoped ? withoutAt : name;
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
  const declaresName = declared.includes(name);
  const declaresTypes = declared.includes(typesName);
  const isDeclared = declaresName || declaresTypes;

  if (isDeclared) return undefined;

  const data = { name, source: source.id };
  const report: EdgeReport = { messageId: 'undeclaredDependency', data };

  return report;
};
