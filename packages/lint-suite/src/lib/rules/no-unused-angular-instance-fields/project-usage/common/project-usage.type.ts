import type { Declaration, Node } from 'typescript';

export type AddDeclaration = (declaration: Declaration) => void;

export type CandidateNames = ReadonlySet<string>;

export type ProjectUsageIndex = {
  readonly has: (node: Node) => boolean;
};
