import {
  Binary,
  Call,
  CombinedRecursiveAstVisitor,
  createCssSelectorFromNode,
  ImplicitReceiver,
  KeyedRead,
  parseTemplate,
  PropertyRead,
  R3TargetBinder,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver,
  TmplAstComponent,
  TmplAstDirective,
  TmplAstElement,
  TmplAstReference,
  TmplAstTemplate
} from '@angular/compiler';
import type { DirectiveMeta, SelectorMatcher } from '@angular/compiler';
import { SignatureKind, TypeFlags } from 'typescript';
import type { ClassLikeDeclaration, TypeChecker } from 'typescript';

import type { ReadSink } from '../common/project-usage.type.js';
import type { AngularClass } from './angular-component-discovery.js';
import {
  stringIndexTypes,
  symbolsForName
} from '../utils/type-property-symbols.js';

type ReferenceOwner =
  TmplAstComponent | TmplAstDirective | TmplAstElement | TmplAstTemplate;

/** Program-wide lookup of the classes a template reference can point at. */
export type DirectiveIndex = {
  readonly byDeclaration: ReadonlyMap<ClassLikeDeclaration, AngularClass>;
  readonly byExportAs: ReadonlyMap<string, readonly ClassLikeDeclaration[]>;
  readonly componentMatcher: SelectorMatcher<ClassLikeDeclaration[]>;
};

export type TemplateReadResult = {
  /** True when a `#reference` was resolved through the directive index. */
  readonly usedDirectiveIndex: boolean;
};

/** Every identifier-like token in a text: a superset of what it can read. */
export const identifierNames = (text: string): Set<string> =>
  new Set(text.match(/[A-Za-z_$][\w$]*/gu) ?? []);

const chainText = (names: readonly ReadSegment[]): string =>
  names
    .map((segment) => `${segment.name}${segment.called ? '()' : ''}`)
    .join('.');

type ReadSegment = {
  readonly called: boolean;
  readonly name: string;
};

type ReadChain = {
  readonly names: ReadSegment[];
  readonly root: PropertyRead;
};

const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

const readChain = (node: PropertyRead | SafePropertyRead): ReadChain | null => {
  const names: ReadSegment[] = [];
  let current: PropertyRead | SafePropertyRead = node;
  let called = false;

  while (true) {
    names.unshift({ called, name: current.name });

    if (
      current.receiver instanceof PropertyRead ||
      current.receiver instanceof SafePropertyRead
    ) {
      current = current.receiver;
      called = false;
      continue;
    }

    if (current.receiver instanceof Call) {
      if (
        !(current.receiver.receiver instanceof PropertyRead) &&
        !(current.receiver.receiver instanceof SafePropertyRead)
      ) {
        return null;
      }

      current = current.receiver.receiver;
      called = true;
      continue;
    }

    return (current.receiver instanceof ImplicitReceiver ||
      current.receiver instanceof ThisReceiver) &&
      current instanceof PropertyRead
      ? { names, root: current }
      : null;
  }
};

class ReadCollector extends CombinedRecursiveAstVisitor {
  readonly reads: ReadChain[] = [];
  readonly referenceOwners = new Map<TmplAstReference, ReferenceOwner>();

  private record(node: PropertyRead | SafePropertyRead): void {
    const chain = readChain(node);

    if (chain) {
      this.reads.push(chain);
    }
  }

  private recordReferences(owner: ReferenceOwner): void {
    for (const reference of owner.references) {
      this.referenceOwners.set(reference, owner);
    }
  }

  override visitElement(element: TmplAstElement): void {
    this.recordReferences(element);
    super.visitElement(element);
  }

  override visitTemplate(template: TmplAstTemplate): void {
    this.recordReferences(template);
    super.visitTemplate(template);
  }

  override visitComponent(component: TmplAstComponent): void {
    this.recordReferences(component);
    super.visitComponent(component);
  }

  override visitDirective(directive: TmplAstDirective): void {
    this.recordReferences(directive);
    super.visitDirective(directive);
  }

  override visitBinary(node: Binary, context: unknown): unknown {
    if (node.operation !== '=') {
      return super.visitBinary(node, context);
    }

    if (
      node.left instanceof PropertyRead ||
      node.left instanceof SafePropertyRead ||
      node.left instanceof KeyedRead ||
      node.left instanceof SafeKeyedRead
    ) {
      this.visit(node.left.receiver);
    }

    if (node.left instanceof KeyedRead || node.left instanceof SafeKeyedRead) {
      this.visit(node.left.key);
    }

    this.visit(node.right);
    return undefined;
  }

  override visitPropertyRead(node: PropertyRead, context: unknown): unknown {
    this.record(node);
    return super.visitPropertyRead(node, context);
  }

  override visitSafePropertyRead(
    node: SafePropertyRead,
    context: unknown
  ): unknown {
    this.record(node);
    return super.visitSafePropertyRead(node, context);
  }
}

const isAnyOrUnknown = (types: readonly { flags: TypeFlags }[]): boolean =>
  types.some(
    (type) => (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0
  );

const addResolvedPath = (
  declaration: ClassLikeDeclaration,
  names: ReadSegment[],
  checker: TypeChecker,
  sink: ReadSink,
  allowMissingRoot: boolean
): boolean => {
  let types = [checker.getTypeAtLocation(declaration)];

  for (const [index, segment] of names.entries()) {
    for (const type of types) {
      sink.addType(type);
    }

    const symbols = new Set(
      types.flatMap((type) => symbolsForName(checker, type, segment.name))
    );

    if (symbols.size === 0) {
      const indexedTypes = types.flatMap((type) =>
        stringIndexTypes(checker, type)
      );

      if (indexedTypes.length > 0) {
        types = indexedTypes;
        continue;
      }

      if (isAnyOrUnknown(types)) {
        return true;
      }

      return index === 0 && allowMissingRoot;
    }

    for (const symbol of symbols) {
      for (const memberDeclaration of symbol.declarations ?? []) {
        sink.addDeclaration(memberDeclaration);
      }
    }

    types = [...symbols].map((symbol) =>
      checker.getTypeOfSymbolAtLocation(symbol, declaration)
    );

    if (segment.called) {
      const returnTypes = types.flatMap((type) =>
        checker
          .getSignaturesOfType(type, SignatureKind.Call)
          .map((signature) => signature.getReturnType())
      );

      if (returnTypes.length === 0) {
        return isAnyOrUnknown(types);
      }

      types = returnTypes;
    }
  }

  return true;
};

/**
 * Classes a `#reference` can resolve to. Candidates come from the whole
 * Program and are narrowed to the component's standalone `imports` when
 * that scope is known; a scope member with `hostDirectives` may expose
 * exportAs names that are not modelled, so it keeps the wider set. Extra
 * candidates only add reads.
 */
const referenceTargets = (
  reference: TmplAstReference,
  owner: ReferenceOwner | undefined,
  directives: DirectiveIndex,
  scope: readonly ClassLikeDeclaration[] | null
): readonly ClassLikeDeclaration[] => {
  const exportAs = reference.value.trim();
  let targets: ClassLikeDeclaration[] = [];

  if (exportAs !== '') {
    targets = [...(directives.byExportAs.get(exportAs) ?? [])];
  } else if (owner instanceof TmplAstElement) {
    directives.componentMatcher.match(
      createCssSelectorFromNode(owner),
      (_selector, declarations) => {
        targets.push(...declarations);
      }
    );
  }

  const scoped =
    scope !== null &&
    !scope.some(
      (declaration) => directives.byDeclaration.get(declaration)?.hostDirectives
    );

  return scoped ? targets.filter((target) => scope.includes(target)) : targets;
};

export const addTemplateReads = (
  { declaration, scope }: AngularClass,
  source: string,
  fileName: string,
  checker: TypeChecker,
  sink: ReadSink,
  directives: DirectiveIndex
): TemplateReadResult => {
  const parsed = parseTemplate(source, fileName);
  const className = declaration.name?.text ?? '(anonymous)';

  if (parsed.errors?.length) {
    sink.addFallbackNames(
      identifierNames(source),
      `${fileName}: template of ${className} does not parse (${parsed.errors[0]?.msg ?? 'unknown error'})`
    );

    return { usedDirectiveIndex: false };
  }

  const boundTarget = templateBinder.bind({ template: parsed.nodes });
  const reads = new ReadCollector();
  let usedDirectiveIndex = false;

  for (const node of parsed.nodes) {
    reads.visit(node);
  }

  for (const chain of reads.reads) {
    const entity =
      chain.root.receiver instanceof ThisReceiver
        ? null
        : boundTarget.getExpressionTarget(chain.root);

    if (entity === null) {
      if (!addResolvedPath(declaration, chain.names, checker, sink, true)) {
        sink.addFallbackNames(
          chain.names.map((segment) => segment.name),
          `${fileName}: cannot resolve '${chainText(chain.names)}' on ${className}`
        );
      }

      continue;
    }

    if (!(entity instanceof TmplAstReference)) {
      continue;
    }

    usedDirectiveIndex = true;

    const targets = referenceTargets(
      entity,
      reads.referenceOwners.get(entity),
      directives,
      scope
    );
    const names = chain.names.slice(1);
    const resolved = targets.map((target) =>
      addResolvedPath(target, names, checker, sink, false)
    );

    // ponytail: with several candidates the mismatching ones are expected
    // to fail; when none resolves, fall back to matching by name.
    if (resolved.length > 0 && !resolved.includes(true)) {
      sink.addFallbackNames(
        names.map((segment) => segment.name),
        `${fileName}: cannot resolve '#${entity.name}.${chainText(names)}' in ${className}`
      );
    }
  }

  return { usedDirectiveIndex };
};
