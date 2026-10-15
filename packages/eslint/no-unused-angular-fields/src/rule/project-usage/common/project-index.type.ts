import type { Node, Program, SourceFile, TypeChecker } from 'typescript';

import type { AngularClass, DirectiveIndex } from './project-usage.type.ts';

export type ProjectUsageIndex = {
  readonly has: (node: Node) => boolean;
};

export type TemplateFileVersion = {
  readonly directory: string;
  readonly fileName: string;
  readonly mtimeNs: bigint;
  readonly size: bigint;
};

export type TemplateReads = {
  readonly templateVersions: TemplateFileVersion[];
  readonly usedDirectiveIndex: boolean;
};

/**
 * Everything one source file contributes to the index: the member
 * declarations it reads, and the files whose contents those resolutions
 * depended on. The entry stays valid while every one of those `SourceFile`
 * objects is still the one the current Program holds.
 */
export type FileEntry = {
  readonly dangling: boolean;
  readonly declarations: ReadonlySet<Node>;
  readonly dependencies: ReadonlySet<SourceFile>;
  readonly fallbackNames: ReadonlySet<string>;
  readonly mentionedNames: ReadonlySet<string>;
  readonly sourceFile: SourceFile;
  readonly templateVersions: TemplateFileVersion[];
  readonly usedDirectiveIndex: boolean;
};

export type FileClasses = {
  readonly candidateNames: ReadonlySet<string>;
  readonly classes: AngularClass[];
  readonly dependencies: ReadonlySet<SourceFile>;
  readonly shape: string;
  readonly sourceFile: SourceFile;
};

export type CurrentSourceFiles = ReadonlySet<SourceFile>;

export type DirectiveState = {
  readonly directives: DirectiveIndex;
  readonly shape: string;
};

export type TemplateCheck = {
  readonly checkedAt: number;
  readonly duration: number;
};

export type ProjectIndex = {
  readonly candidateNames: Set<string>;
  readonly classes: Map<string, FileClasses>;
  readonly declarationCounts: Map<Node, number>;
  directiveState: DirectiveState;
  readonly entries: Map<string, FileEntry>;
  readonly fallbackNameCounts: Map<string, number>;
  program: Program | null;
  templateCheck: TemplateCheck;
};

export type LazyChecker = () => TypeChecker;
