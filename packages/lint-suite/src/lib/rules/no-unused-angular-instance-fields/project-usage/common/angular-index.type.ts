import type { Declaration } from 'typescript';

type IndexedReferenceTarget = {
  readonly kind: number;
  readonly target?: Target | null;
};

type Target = {
  readonly directive: Declaration | null;
};

export type IndexedIdentifier = {
  readonly kind: number;
  readonly name: string;
  readonly span: Span;
  readonly target?: IndexedReferenceTarget | null;
};

type Span = {
  readonly start: number;
};

type ReferenceInfo = {
  readonly kind: 0;
  readonly target: IndexedReferenceTarget | null;
};

export type IndexedPropertyIdentifier = IndexedIdentifier & ReferenceInfo;

type Template = {
  readonly fileUrl: string;
  readonly identifiers: Set<IndexedIdentifier>;
};

export type IndexedComponent = {
  readonly errors: Error[];
  readonly fileUrl: string;
  readonly template: Template;
};
