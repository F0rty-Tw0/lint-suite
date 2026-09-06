import type { TSESLint } from '@typescript-eslint/utils';
import type { Expression, SourceFile } from 'typescript';

export type MessageIds = 'unusedExport' | 'unusedModule';

export type RuleOptions = { readonly entryPoints: string[] };

export type Options = [RuleOptions];

export type RuleContext = TSESLint.RuleContext<MessageIds, Options>;

export type ImportEdge = {
  readonly target: string;
  readonly names: string[];
};

export type ReExportEdge = {
  readonly target: string;
  readonly source: string;
  readonly exported: string;
};

export type FileEdges = {
  readonly fileName: string;
  readonly exports: string[];
  readonly declared: Set<string>;
  readonly imports: ImportEdge[];
  readonly reExports: ReExportEdge[];
  readonly starTargets: string[];
  readonly skipped: boolean;
};

export type EdgeAccumulator = {
  readonly exports: string[];
  readonly declared: Set<string>;
  readonly imports: ImportEdge[];
  readonly reExports: ReExportEdge[];
  readonly starTargets: string[];
};

export type ModuleResolver = (
  specifier: Expression | undefined
) => string | undefined;

export type ExportUsage = Map<string, Map<string, number>>;

export type PublicExports = Map<string, Set<string>>;

export type ReExportIndex = Map<string, Map<string, ReExportEdge>>;

export type UsageKey = {
  readonly fileName: string;
  readonly name: string;
};

export type UsageContext = {
  readonly byFile: Map<string, FileEdges>;
  readonly reExportsByName: ReExportIndex;
};

export type UsageWalk = {
  readonly visited: Set<string>;
  readonly depth: number;
  readonly keys: UsageKey[];
};

export type FileContribution = {
  readonly usage: UsageKey[];
  readonly imported: string[];
  readonly starTouched: string[];
};

export type FileChange = {
  readonly fileName: string;
  readonly before: FileEdges | undefined;
  readonly after: FileEdges | undefined;
};

export type Aggregate = {
  readonly byFile: Map<string, FileEdges>;
  readonly usage: ExportUsage;
  readonly imported: Map<string, number>;
  readonly reExportsByName: ReExportIndex;
  readonly contributions: Map<string, FileContribution>;
  readonly starTouched: Map<string, number>;
};

export type IsExternalFile = (sourceFile: SourceFile) => boolean;
