import type {
  PropertyRead,
  SelectorMatcher,
  TmplAstComponent,
  TmplAstDirective,
  TmplAstElement,
  TmplAstTemplate
} from '@angular/compiler';

import type {
  ArrayLiteralExpression,
  BindingPattern,
  ClassLikeDeclaration,
  Declaration,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  Type,
  TypeChecker
} from 'typescript';

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

export type AssignmentPattern =
  ArrayLiteralExpression | ObjectLiteralExpression;

export type DestructuringPattern = AssignmentPattern | BindingPattern;

/**
 * One element of a destructuring pattern, reduced to what read collection
 * needs: the property names it reads (null reads every property), the
 * pattern nested inside it, and the node its type is resolved at.
 */
export type PatternElementRead = {
  readonly location: Node;
  readonly names: string[] | null;
  readonly nested: DestructuringPattern | null;
  readonly rest: boolean;
};

type ExternalAngularTemplate = {
  readonly fileName: string;
  readonly kind: 'external';
};

type InlineAngularTemplate = {
  readonly kind: 'inline';
  readonly source: string;
};

export type AngularTemplate = ExternalAngularTemplate | InlineAngularTemplate;

export type AngularClass = {
  readonly component: boolean;
  readonly declaration: ClassLikeDeclaration;
  readonly exportAs: string[];
  /** True when `hostDirectives` is set; their exportAs is not modelled. */
  readonly hostDirectives: boolean;
  readonly name: string;
  /**
   * Program classes a standalone component's `imports` resolve to, or null
   * when the compilation scope cannot be determined statically.
   */
  readonly scope: ClassLikeDeclaration[] | null;
  readonly selector: string | null;
  readonly template: AngularTemplate | null;
  /** False when the metadata cannot be read statically (fail closed). */
  readonly valid: boolean;
};

export type DecoratorKind = 'Component' | 'Directive' | 'NgModule' | 'Pipe';

export type Discovery = {
  readonly checker: TypeChecker;
  /** Files whose contents the discovered metadata depends on. */
  readonly dependencies: Set<SourceFile>;
};

export type DiscoveredClasses = {
  readonly classes: AngularClass[];
  readonly dependencies: ReadonlySet<SourceFile>;
};

/** Program-wide lookup of the classes a template reference can point at. */
export type DirectiveIndex = {
  readonly byDeclaration: ReadonlyMap<ClassLikeDeclaration, AngularClass>;
  readonly byExportAs: ReadonlyMap<string, ClassLikeDeclaration[]>;
  readonly componentMatcher: SelectorMatcher<ClassLikeDeclaration[]>;
};

export type ReferenceOwner =
  TmplAstComponent | TmplAstDirective | TmplAstElement | TmplAstTemplate;

export type ReadSegment = {
  readonly called: boolean;
  readonly name: string;
};

export type ReadChain = {
  readonly names: ReadSegment[];
  readonly root: PropertyRead;
};

export type ResolvedPathOptions = {
  readonly allowMissingRoot: boolean;
  readonly checker: TypeChecker;
  readonly declaration: ClassLikeDeclaration;
  readonly names: ReadSegment[];
  readonly sink: ReadSink;
};

export type TemplateReadContext = {
  readonly checker: TypeChecker;
  readonly className: string;
  readonly declaration: ClassLikeDeclaration;
  readonly directives: DirectiveIndex;
  readonly fileName: string;
  readonly scope: ClassLikeDeclaration[] | null;
  readonly sink: ReadSink;
};

export type TemplateReadsOptions = {
  readonly angularClass: AngularClass;
  readonly checker: TypeChecker;
  readonly directives: DirectiveIndex;
  readonly fileName: string;
  readonly sink: ReadSink;
  readonly source: string;
};

export type CollectTemplateReadsOptions = {
  readonly allNames: CandidateNames;
  readonly checker: TypeChecker;
  readonly classes: AngularClass[];
  readonly directives: DirectiveIndex;
  readonly sink: ReadSink;
};
