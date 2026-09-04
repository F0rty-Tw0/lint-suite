import {
  isArrayBindingPattern,
  isArrayLiteralExpression,
  isBinaryExpression,
  isBindingElement,
  isIdentifier,
  isObjectBindingPattern,
  isObjectLiteralExpression,
  isOmittedExpression,
  isPropertyAssignment,
  isSpreadAssignment,
  isSpreadElement,
  isVariableDeclaration,
  SyntaxKind
} from 'typescript';
import type {
  ArrayLiteralExpression,
  BindingElement,
  BindingPattern,
  Node,
  ObjectLiteralExpression,
  Type,
  TypeChecker
} from 'typescript';

import type { CandidateNames, ReadSink } from '../common/project-usage.type.js';
import {
  addNamedProperties,
  addSymbolDeclarations,
  allPropertySymbols,
  propertyName
} from './typescript-symbol-reads.js';

type LazyType = () => Type;

const isBindingPattern = (node: Node): node is BindingPattern => {
  const isArrayPattern = isArrayBindingPattern(node);
  const isObjectPattern = isObjectBindingPattern(node);

  return isArrayPattern || isObjectPattern;
};

const lazyType = (compute: () => Type): LazyType => {
  let type: Type | undefined;

  return () => (type ??= compute());
};

const skippable = (
  names: string[] | null,
  nested: boolean,
  candidateNames: CandidateNames
): boolean => {
  if (nested) return false;
  if (names === null) return false;

  const hasCandidateName = names.some((name) => candidateNames.has(name));

  return !hasCandidateName;
};

const bindingNames = (
  checker: TypeChecker,
  element: BindingElement
): string[] | null => {
  if (element.propertyName) return propertyName(checker, element.propertyName);

  const isIdentifierName = isIdentifier(element.name);

  if (!isIdentifierName) return null;

  return [element.name.text];
};

const collectBindingPattern = (
  pattern: BindingPattern,
  type: LazyType,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const isArrayPattern = isArrayBindingPattern(pattern);

  if (isArrayPattern) {
    for (const [index, element] of pattern.elements.entries()) {
      const isOmitted = isOmittedExpression(element);

      if (isOmitted) continue;

      const indexNames = [String(index)];
      const names = element.dotDotDotToken ? null : indexNames;
      const nested = isBindingPattern(element.name);
      const isSkippable = skippable(names, nested, candidateNames);

      if (isSkippable) continue;

      const symbols = addNamedProperties(checker, type(), names, sink);

      if (nested) {
        for (const symbol of symbols) {
          collectBindingPattern(
            element.name,
            lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
            checker,
            sink,
            candidateNames
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const element of pattern.elements) {
    if (element.dotDotDotToken) {
      sink.addType(type());

      for (const symbol of allPropertySymbols(checker, type())) {
        const isConsumed = consumed.has(symbol.name);

        if (!isConsumed) {
          addSymbolDeclarations(checker, symbol, sink);
        }
      }
      continue;
    }

    const names = bindingNames(checker, element);

    for (const name of names ?? []) {
      consumed.add(name);
    }

    const nested = isBindingPattern(element.name);
    const isSkippable = skippable(names, nested, candidateNames);

    if (isSkippable) continue;

    const symbols = addNamedProperties(checker, type(), names, sink);

    if (nested) {
      for (const symbol of symbols) {
        collectBindingPattern(
          element.name,
          lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
          checker,
          sink,
          candidateNames
        );
      }
    }
  }
};

const collectAssignmentPattern = (
  pattern: ArrayLiteralExpression | ObjectLiteralExpression,
  type: LazyType,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const isArrayPattern = isArrayLiteralExpression(pattern);

  if (isArrayPattern) {
    for (const [index, element] of pattern.elements.entries()) {
      const isOmitted = isOmittedExpression(element);

      if (isOmitted) continue;

      const indexNames = [String(index)];
      const names = isSpreadElement(element) ? null : indexNames;
      const nested =
        isArrayLiteralExpression(element) || isObjectLiteralExpression(element);
      const isSkippable = skippable(names, nested, candidateNames);

      if (isSkippable) continue;

      const symbols = addNamedProperties(checker, type(), names, sink);

      if (nested) {
        for (const symbol of symbols) {
          collectAssignmentPattern(
            element,
            lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
            checker,
            sink,
            candidateNames
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const property of pattern.properties) {
    const isSpread = isSpreadAssignment(property);

    if (isSpread) {
      sink.addType(type());

      for (const symbol of allPropertySymbols(checker, type())) {
        const isConsumed = consumed.has(symbol.name);

        if (!isConsumed) {
          addSymbolDeclarations(checker, symbol, sink);
        }
      }
      continue;
    }

    const names = propertyName(checker, property.name);

    for (const name of names ?? []) {
      consumed.add(name);
    }

    const nested =
      isPropertyAssignment(property) &&
      (isArrayLiteralExpression(property.initializer) ||
        isObjectLiteralExpression(property.initializer));
    const isSkippable = skippable(names, nested, candidateNames);

    if (isSkippable) continue;

    const symbols = addNamedProperties(checker, type(), names, sink);

    if (nested) {
      for (const symbol of symbols) {
        collectAssignmentPattern(
          property.initializer,
          lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, property)),
          checker,
          sink,
          candidateNames
        );
      }
    }
  }
};

export const collectDestructuringReads = (
  node: Node,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const isPattern = isBindingPattern(node);

  if (isPattern) {
    const isBindingElementParent = isBindingElement(node.parent);
    const isNestedBindingName =
      isBindingElementParent && node.parent.name === node;

    if (isNestedBindingName) return;

    const declaration = node.parent;
    const source =
      isVariableDeclaration(declaration) && declaration.initializer
        ? declaration.initializer
        : declaration;

    collectBindingPattern(
      node,
      lazyType(() => checker.getTypeAtLocation(source)),
      checker,
      sink,
      candidateNames
    );

    return;
  }

  const isBinary = isBinaryExpression(node);

  if (!isBinary) return;

  const isEqualsAssignment = node.operatorToken.kind === SyntaxKind.EqualsToken;

  if (!isEqualsAssignment) return;

  const isArrayTarget = isArrayLiteralExpression(node.left);
  const isObjectTarget = isObjectLiteralExpression(node.left);
  const isDestructuringAssignment = isArrayTarget || isObjectTarget;

  if (!isDestructuringAssignment) return;

  collectAssignmentPattern(
    node.left,
    lazyType(() => checker.getTypeAtLocation(node.right)),
    checker,
    sink,
    candidateNames
  );
};
