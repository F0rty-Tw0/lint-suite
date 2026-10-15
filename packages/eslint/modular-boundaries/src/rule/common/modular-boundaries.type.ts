import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type ParseSuccess<T> = { readonly ok: true; data: T };

type ParseFailure = { readonly ok: false; readonly message: string };

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export type ConfigError = { readonly file: string; readonly message: string };

/** Collects shape errors for one config `file` into `errors`. */
export type ShapeReader = {
  readonly file: string;
  readonly errors: ConfigError[];
};

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

export type DiscoveredRoot = {
  readonly root: string;
  readonly moonId?: string;
};

export type DiscoveredRoots = {
  roots: DiscoveredRoot[];
  errors: ConfigError[];
};

export type Project = {
  readonly id: string;
  readonly root: string;
  readonly packageName?: string;
  tags: string[];
  declaredDependencies: string[];
  readonly hasOwnPackageJson: boolean;
};

export type ProjectRead = { project?: Project; errors: ConfigError[] };

/** Projects left after dropping duplicates, plus one error per colliding pair. */
export type CheckedProjects = { projects: Project[]; errors: ConfigError[] };

/** `target` is absolute and may contain `*`. */
export type PathAlias = { readonly pattern: string; readonly target: string };

/** When a model or graph was last checked against disk; replaced, never mutated. */
export type Validation = { readonly at: number };

export type WorkspaceModel = {
  readonly root: string;
  projects: Project[];
  projectByRoot: Map<string, Project>;
  projectByPackageName: Map<string, Project>;
  pathAliases: PathAlias[];
  rootTurbo?: unknown;
  moonWorkspace?: unknown;
  listing: WorkspaceListing;
  errors: ConfigError[];
  readSet: ReadSet;
  validation: Validation;
};

export type ConstraintMatch = { anyOf?: string[]; allOf?: string[] };

export type Constraint = {
  readonly side: 'source' | 'target';
  match: ConstraintMatch;
  onlyTags?: string[];
  notTags?: string[];
  allowedExternal?: string[];
  bannedExternal?: string[];
  readonly matchesPackageName: boolean;
  readonly origin: 'eslint' | 'turbo.json' | '.moon/workspace.yml';
};

export type TagMatcher = (tags: string[]) => boolean;

export type SpecifierMatcher = (specifier: string) => boolean;

/** Compiled tag and external-import patterns, keyed by pattern text. */
export type CompiledPatterns = {
  readonly tags: Map<string, TagMatcher>;
  readonly globs: Map<string, RegExp>;
};

/** Match maps keep merge order per project. */
export type ConstraintSet = {
  constraints: Constraint[];
  sourceMatches: Map<Project, Constraint[]>;
  targetMatches: Map<Project, Constraint[]>;
  eslintSourceMatched: Set<Project>;
  readonly hasEslintConstraints: boolean;
  errors: ConfigError[];
  readonly patterns: CompiledPatterns;
  readonly allow: SpecifierMatcher[];
};

type SkipTarget = { readonly kind: 'skip' };

export type NpmTarget = {
  readonly kind: 'npm';
  readonly name: string;
  readonly specifier: string;
};

export type ProjectTarget = {
  readonly kind: 'project';
  project: Project;
  readonly via: 'relative' | 'package' | 'alias';
};

export type Target = SkipTarget | NpmTarget | ProjectTarget;

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
  validation: Validation;
};

type DepConstraintRules = {
  onlyDependOnLibsWithTags?: string[];
  notDependOnLibsWithTags?: string[];
  allowedExternalImports?: string[];
  bannedExternalImports?: string[];
};

type SourceTagField = { readonly sourceTag: string };

type AllSourceTagsField = { allSourceTags: string[] };

type SourceTagConstraint = DepConstraintRules & SourceTagField;

type AllSourceTagsConstraint = DepConstraintRules & AllSourceTagsField;

export type DepConstraint = SourceTagConstraint | AllSourceTagsConstraint;

type ConfigSources = { readonly turbo?: boolean; readonly moon?: boolean };

export type RuleOptions = {
  allow?: string[];
  depConstraints?: DepConstraint[];
  ignoredCircularDependencies?: [string, string][];
  readonly checkCircularDependencies?: boolean;
  readonly checkUndeclaredDependencies?: boolean;
  configSources?: ConfigSources;
  readonly workspaceRoot?: string;
};

export type Options = [RuleOptions];

export type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

export type EdgeVisitor = (node: TSESTree.Node, specifier: string) => void;
