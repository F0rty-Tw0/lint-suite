import type {
  CompiledPatterns,
  ConfigError,
  Constraint,
  ConstraintMatch,
  ConstraintSet,
  DepConstraint,
  Project,
  RuleOptions,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import { configConstraints } from './utils/config-constraints.util.ts';
import {
  compiledPatterns,
  importMatcher,
  tagMatcherIn
} from './utils/tag-patterns.util.ts';

const setsByModel = new WeakMap<WorkspaceModel, Map<string, ConstraintSet>>();

const sourceMatchOf = (entry: DepConstraint): ConstraintMatch => {
  if ('sourceTag' in entry) {
    const anyOf: ConstraintMatch = { anyOf: [entry.sourceTag] };

    return anyOf;
  }

  const allOf: ConstraintMatch = { allOf: entry.allSourceTags };

  return allOf;
};

const translateEslintConstraint = (entry: DepConstraint): Constraint => {
  const match = sourceMatchOf(entry);
  const constraint: Constraint = {
    side: 'source',
    match,
    matchesPackageName: false,
    origin: 'eslint'
  };

  if (entry.onlyDependOnLibsWithTags) {
    constraint.onlyTags = entry.onlyDependOnLibsWithTags;
  }

  if (entry.notDependOnLibsWithTags) {
    constraint.notTags = entry.notDependOnLibsWithTags;
  }

  if (entry.allowedExternalImports) {
    constraint.allowedExternal = entry.allowedExternalImports;
  }

  if (entry.bannedExternalImports) {
    constraint.bannedExternal = entry.bannedExternalImports;
  }

  return constraint;
};

const matchesTags = (
  match: ConstraintMatch,
  tags: string[],
  patterns: CompiledPatterns
): boolean => {
  const carries = (pattern: string): boolean => {
    const matches = tagMatcherIn(patterns, pattern);

    return matches(tags);
  };
  const allOf = match.allOf ?? [];
  const hasAll = allOf.every(carries);

  if (!hasAll) return false;

  if (!match.anyOf) return true;

  return match.anyOf.some(carries);
};

const matchesBySide = (
  constraints: Constraint[],
  projects: Project[],
  side: Constraint['side'],
  patterns: CompiledPatterns
): Map<Project, Constraint[]> => {
  const matches = new Map<Project, Constraint[]>();
  const sided = constraints.filter((constraint) => constraint.side === side);

  for (const project of projects) {
    const matchesProject = (constraint: Constraint): boolean => {
      return matchesTags(constraint.match, project.tags, patterns);
    };
    const matching = sided.filter(matchesProject);

    if (matching.length > 0) matches.set(project, matching);
  }

  return matches;
};

const isEslintOrigin = (constraint: Constraint): boolean => {
  return constraint.origin === 'eslint';
};

const eslintMatchedProjects = (
  sourceMatches: Map<Project, Constraint[]>
): Set<Project> => {
  const matched = new Set<Project>();

  for (const [project, constraints] of sourceMatches) {
    const hasEslint = constraints.some(isEslintOrigin);

    if (hasEslint) matched.add(project);
  }

  return matched;
};

/** Merge order: ESLint, root `turbo.json`, `.moon/workspace.yml`. */
const loadConstraints = (
  model: WorkspaceModel,
  options: RuleOptions
): ConstraintSet => {
  const depConstraints = options.depConstraints ?? [];
  const eslintConstraints = depConstraints.map(translateEslintConstraint);
  const errors: ConfigError[] = [];
  const translated = configConstraints(model, options, errors);
  const constraints = [...eslintConstraints, ...translated];
  const patterns = compiledPatterns(constraints);
  const { projects } = model;
  const sourceMatches = matchesBySide(
    constraints,
    projects,
    'source',
    patterns
  );
  const targetMatches = matchesBySide(
    constraints,
    projects,
    'target',
    patterns
  );
  const eslintSourceMatched = eslintMatchedProjects(sourceMatches);
  const allowPatterns = options.allow ?? [];
  const allow = allowPatterns.map(importMatcher);
  const set: ConstraintSet = {
    constraints,
    sourceMatches,
    targetMatches,
    eslintSourceMatched,
    hasEslintConstraints: depConstraints.length > 0,
    errors,
    patterns,
    allow
  };

  return set;
};

/** Cached per model and per `JSON.stringify(options)`, so deep-equal options share one set. */
export const constraintsFor = (
  model: WorkspaceModel,
  options: RuleOptions
): ConstraintSet => {
  const setsByOptions =
    setsByModel.get(model) ?? new Map<string, ConstraintSet>();
  const optionsKey = JSON.stringify(options);
  const cached = setsByOptions.get(optionsKey);

  if (cached) return cached;

  const set = loadConstraints(model, options);

  setsByOptions.set(optionsKey, set);
  setsByModel.set(model, setsByOptions);

  return set;
};
