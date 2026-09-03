import type { Declaration, Node, Type } from 'typescript';

export type AddDeclaration = (declaration: Declaration) => void;

/**
 * Receives every read resolved while indexing one source file. Types are
 * reported wherever a member is looked up on them, so the index can tell
 * which files may change the outcome of that lookup later.
 */
export type ReadSink = {
  readonly addDeclaration: AddDeclaration;
  /**
   * Reports that reads could not be resolved exactly; every candidate
   * member with one of these names is then treated as read. `reason` is
   * surfaced when LINT_SUITE_DEBUG is set.
   */
  readonly addFallbackNames: (names: Iterable<string>, reason: string) => void;
  readonly addType: (type: Type) => void;
};

export type CandidateNames = ReadonlySet<string>;

export type ProjectUsageIndex = {
  readonly has: (node: Node) => boolean;
};
