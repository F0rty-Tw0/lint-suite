import {
  SyntaxKind,
  isArrayLiteralExpression,
  isBinaryExpression,
  isBindingElement,
  isObjectLiteralExpression,
  isVariableDeclaration
} from 'typescript';
import type { Node, Type, TypeChecker } from 'typescript';

import { assignmentPatternElements } from './typescript-assignment-pattern-elements.ts';
import {
  bindingPatternElements,
  isBindingPattern
} from './typescript-binding-pattern-elements.ts';
import {
  addNamedProperties,
  addSymbolDeclarations,
  allPropertySymbols
} from './typescript-symbol-reads.ts';
import type {
  CandidateNames,
  DestructuringPattern,
  PatternElementRead,
  ReadSink
} from '../common/project-usage.type.ts';

type LazyType = () => Type;

type PatternReadContext = {
  readonly checker: TypeChecker;
  readonly sink: ReadSink;
  readonly candidateNames: CandidateNames;
};

const lazyType = (compute: () => Type): LazyType => {
  let type: Type | undefined;

  return () => (type ??= compute());
};

const isSkippable = (
  read: PatternElementRead,
  candidateNames: CandidateNames
): boolean => {
  if (read.nested !== null) return false;

  if (read.names === null) return false;

  const hasCandidateName = read.names.some((name) => candidateNames.has(name));

  return !hasCandidateName;
};

const patternElements = (
  pattern: DestructuringPattern,
  checker: TypeChecker
): PatternElementRead[] => {
  const isBinding = isBindingPattern(pattern);

  if (isBinding) return bindingPatternElements(pattern, checker);

  return assignmentPatternElements(pattern, checker);
};

const addRestReads = (
  type: Type,
  consumed: Set<string>,
  context: PatternReadContext
): void => {
  context.sink.addType(type);

  for (const symbol of allPropertySymbols(context.checker, type)) {
    const isConsumed = consumed.has(symbol.name);

    if (isConsumed) continue;

    addSymbolDeclarations(context.checker, symbol, context.sink);
  }
};

const collectPatternReads = (
  pattern: DestructuringPattern,
  type: LazyType,
  context: PatternReadContext
): void => {
  const { checker, sink, candidateNames } = context;
  const consumed = new Set<string>();
  const reads = patternElements(pattern, checker);

  for (const read of reads) {
    if (read.rest) {
      addRestReads(type(), consumed, context);
      continue;
    }

    for (const name of read.names ?? []) {
      consumed.add(name);
    }

    const skip = isSkippable(read, candidateNames);

    if (skip) continue;

    const symbols = addNamedProperties(checker, type(), read.names, sink);
    const nested = read.nested;

    if (nested === null) continue;

    for (const symbol of symbols) {
      const nestedType = lazyType(() => {
        return checker.getTypeOfSymbolAtLocation(symbol, read.location);
      });

      collectPatternReads(nested, nestedType, context);
    }
  }
};

const collectBindingReads = (node: Node, context: PatternReadContext): void => {
  const isBinding = isBindingPattern(node);

  if (!isBinding) return;

  const isBindingElementParent = isBindingElement(node.parent);
  const isNestedBindingName =
    isBindingElementParent && node.parent.name === node;

  if (isNestedBindingName) return;

  const declaration = node.parent;
  const isDeclaration = isVariableDeclaration(declaration);
  const isInitializedDeclaration =
    isDeclaration && declaration.initializer !== undefined;
  const source = isInitializedDeclaration
    ? declaration.initializer
    : declaration;
  const sourceTypeOf = (): Type => context.checker.getTypeAtLocation(source);
  const sourceType = lazyType(sourceTypeOf);

  collectPatternReads(node, sourceType, context);
};

const collectAssignmentReads = (
  node: Node,
  context: PatternReadContext
): void => {
  const isBinary = isBinaryExpression(node);

  if (!isBinary) return;

  const isEqualsAssignment = node.operatorToken.kind === SyntaxKind.EqualsToken;

  if (!isEqualsAssignment) return;

  const isArrayTarget = isArrayLiteralExpression(node.left);
  const isObjectTarget = isObjectLiteralExpression(node.left);
  const isDestructuringAssignment = isArrayTarget || isObjectTarget;

  if (!isDestructuringAssignment) return;

  const rightTypeOf = (): Type => context.checker.getTypeAtLocation(node.right);
  const sourceType = lazyType(rightTypeOf);

  collectPatternReads(node.left, sourceType, context);
};

export const collectDestructuringReads = (
  node: Node,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const context: PatternReadContext = { checker, sink, candidateNames };

  collectBindingReads(node, context);
  collectAssignmentReads(node, context);
};
