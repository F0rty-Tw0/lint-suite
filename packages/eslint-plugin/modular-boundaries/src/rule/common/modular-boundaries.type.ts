import type { TSESLint } from '@typescript-eslint/utils';

export type ParseResult<T> =
  { ok: true; data: T } | { ok: false; message: string };

export type ConfigError = { file: string; message: string };

/** A parsed manifest object; `undefined` when the file is missing or malformed. */
export type JsonObject = Record<string, unknown> | undefined;

export type Parser<T> = (text: string, path: string) => ParseResult<T>;

/** Path → value reference returned by `readCached` (null if missing). `parserFor(path)` picks the parser. */
export type ReadSet = Map<string, unknown>;

export type WorkspaceListing = {
  manifests: string[];
  packageTurboFiles: string[];
  sourceFiles: string[];
};

export type DiscoveredRoot = { root: string; moonId?: string };

export type DiscoveredRoots = {
  roots: DiscoveredRoot[];
  errors: ConfigError[];
};

export type Project = {
  id: string;
  root: string;
  packageName?: string;
  tags: string[];
  declaredDependencies: string[];
  hasOwnPackageJson: boolean;
};

export type ProjectRead = { project?: Project; errors: ConfigError[] };

/** Projects left after dropping duplicates, plus one error per colliding pair. */
export type CheckedProjects = { projects: Project[]; errors: ConfigError[] };

/** `target` is absolute and may contain `*`. */
export type PathAlias = { pattern: string; target: string };

export type WorkspaceModel = {
  root: string;
  projects: Project[];
  projectByRoot: Map<string, Project>;
  projectByPackageName: Map<string, Project>;
  pathAliases: PathAlias[];
  rootTurbo?: unknown;
  moonWorkspace?: unknown;
  listing: WorkspaceListing;
  errors: ConfigError[];
  readSet: ReadSet;
  lastValidatedAt: number;
};

export type ConstraintMatch = { anyOf?: string[]; allOf?: string[] };

export type Constraint = {
  side: 'source' | 'target';
  match: ConstraintMatch;
  onlyTags?: string[];
  notTags?: string[];
  allowedExternal?: string[];
  bannedExternal?: string[];
  matchesPackageName: boolean;
  origin: 'eslint' | 'turbo.json' | '.moon/workspace.yml';
};

/** Match maps keep merge order per project. */
export type ConstraintSet = {
  constraints: Constraint[];
  sourceMatches: Map<Project, Constraint[]>;
  targetMatches: Map<Project, Constraint[]>;
  eslintSourceMatched: Set<Project>;
  hasEslintConstraints: boolean;
  errors: ConfigError[];
};

export type Target =
  | { kind: 'skip' }
  | { kind: 'npm'; name: string; specifier: string }
  | {
      kind: 'project';
      project: Project;
      via: 'relative' | 'package' | 'alias';
    };

export type MessageIds =
  | 'noRelativeOrAbsoluteImportsAcrossLibraries'
  | 'noSelfCircularDependencies'
  | 'bannedExternalImportsViolation'
  | 'undeclaredDependency'
  | 'noCircularDependencies'
  | 'projectWithoutTagsCannotHaveDependencies'
  | 'onlyTagsConstraintViolation'
  | 'emptyOnlyTagsConstraintViolation'
  | 'notTagsConstraintViolation'
  | 'workspaceConfigError';

export type EdgeReport = {
  messageId: MessageIds;
  data: Record<string, string>;
};

/** `sourceFiles` snapshots `model.listing.sourceFiles`; `specifierRefs` maps file → `readCached` value reference. */
export type RawGraph = {
  adjacency: Map<Project, Set<Project>>;
  sourceFiles: string[];
  specifierRefs: Map<string, unknown>;
  validatedAt: number;
};

type DepConstraintRules = {
  onlyDependOnLibsWithTags?: string[];
  notDependOnLibsWithTags?: string[];
  allowedExternalImports?: string[];
  bannedExternalImports?: string[];
};

type SourceTagConstraint = DepConstraintRules & { sourceTag: string };

type AllSourceTagsConstraint = DepConstraintRules & {
  allSourceTags: string[];
};

export type DepConstraint = SourceTagConstraint | AllSourceTagsConstraint;

export type ConfigSources = { turbo?: boolean; moon?: boolean };

export type RuleOptions = {
  allow?: string[];
  depConstraints?: DepConstraint[];
  ignoredCircularDependencies?: [string, string][];
  checkCircularDependencies?: boolean;
  checkUndeclaredDependencies?: boolean;
  configSources?: ConfigSources;
  workspaceRoot?: string;
};

export type Options = [RuleOptions];

export type RuleContext = TSESLint.RuleContext<MessageIds, Options>;
