import { readFileSync } from 'node:fs';

import {
  Binary,
  Call,
  CombinedRecursiveAstVisitor,
  ImplicitReceiver,
  KeyedRead,
  parseTemplate,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver
} from '@angular/compiler';
import { SignatureKind, TypeFlags } from 'typescript';
import type { Declaration, TypeChecker } from 'typescript';

import type {
  IndexedComponent,
  IndexedIdentifier,
  IndexedPropertyIdentifier
} from '../common/angular-index.type.js';
import type { AddDeclaration } from '../common/project-usage.type.js';
import {
  stringIndexTypes,
  symbolsForName
} from '../utils/type-property-symbols.js';
import { inlineTemplate } from './angular-component-discovery.js';

const propertyIdentifierKind = 0;
const referenceIdentifierKind = 5;

type ReadSegment = {
  readonly called: boolean;
  readonly name: string;
};

type ReadChain = {
  readonly names: ReadSegment[];
  readonly root: PropertyRead;
};

class RootCollector extends CombinedRecursiveAstVisitor {
  readonly roots: PropertyRead[] = [];

  override visitPropertyRead(node: PropertyRead, context: unknown): unknown {
    if (
      node.receiver instanceof ImplicitReceiver ||
      node.receiver instanceof ThisReceiver
    ) {
      this.roots.push(node);
    }

    return super.visitPropertyRead(node, context);
  }
}

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

  private record(node: PropertyRead | SafePropertyRead): void {
    const chain = readChain(node);

    if (chain) {
      this.reads.push(chain);
    }
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

const templateText = (
  declaration: Declaration,
  component: IndexedComponent,
  checker: TypeChecker
): string | null => {
  if (component.template.fileUrl === component.fileUrl) {
    return inlineTemplate(declaration, checker);
  }

  return readFileSync(component.template.fileUrl, 'utf8');
};

const isPropertyIdentifier = (
  identifier: IndexedIdentifier
): identifier is IndexedPropertyIdentifier =>
  identifier.kind === propertyIdentifierKind;

const addResolvedPath = (
  declaration: Declaration,
  names: ReadSegment[],
  checker: TypeChecker,
  addDeclaration: AddDeclaration,
  allowMissingRoot: boolean
): boolean => {
  let types = [checker.getTypeAtLocation(declaration)];

  for (const [index, segment] of names.entries()) {
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

      if (
        types.some(
          (type) =>
            (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0
        )
      ) {
        return true;
      }

      return index === 0 && allowMissingRoot;
    }

    for (const symbol of symbols) {
      for (const memberDeclaration of symbol.declarations ?? []) {
        addDeclaration(memberDeclaration);
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
        if (
          types.some(
            (type) =>
              (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0
          )
        ) {
          return true;
        }

        return false;
      }

      types = returnTypes;
    }
  }

  return true;
};

export const addTemplateReads = (
  declaration: Declaration,
  component: IndexedComponent,
  checker: TypeChecker,
  addDeclaration: AddDeclaration,
  missingRootNames: Set<string>
): boolean => {
  const source = templateText(declaration, component, checker);

  if (source === null) {
    return false;
  }

  const parsed = parseTemplate(source, component.template.fileUrl);

  if (parsed.errors?.length) {
    return false;
  }

  const roots = new RootCollector();
  const reads = new ReadCollector();

  for (const node of parsed.nodes) {
    roots.visit(node);
    reads.visit(node);
  }

  roots.roots.sort((left, right) => left.nameSpan.start - right.nameSpan.start);
  const indexedRoots = [...component.template.identifiers]
    .filter(isPropertyIdentifier)
    .sort((left, right) => left.span.start - right.span.start);

  const indexedByRoot = new Map<PropertyRead, IndexedPropertyIdentifier>();
  let indexedRootIndex = 0;

  for (const root of roots.roots) {
    const identifier = indexedRoots[indexedRootIndex];

    if (identifier?.name === root.name) {
      indexedByRoot.set(root, identifier);
      indexedRootIndex += 1;
    } else if (!missingRootNames.has(root.name)) {
      return false;
    }
  }

  if (indexedRootIndex !== indexedRoots.length) {
    return false;
  }

  for (const chain of reads.reads) {
    const identifier = indexedByRoot.get(chain.root);

    if (!identifier) {
      if (missingRootNames.has(chain.root.name)) {
        continue;
      }

      return false;
    }

    if (identifier.target === null) {
      if (
        !addResolvedPath(
          declaration,
          chain.names,
          checker,
          addDeclaration,
          true
        )
      ) {
        return false;
      }
      continue;
    }

    if (identifier.target.kind !== referenceIdentifierKind) {
      continue;
    }

    const referenceTarget = identifier.target.target;

    if (!referenceTarget) {
      return false;
    }

    const targetDeclaration = referenceTarget.directive;
    const targetNames = chain.names.slice(1);
    const targetResolved =
      !targetDeclaration ||
      addResolvedPath(
        targetDeclaration,
        targetNames,
        checker,
        addDeclaration,
        false
      );

    if (!targetResolved) {
      return false;
    }
  }

  return true;
};
