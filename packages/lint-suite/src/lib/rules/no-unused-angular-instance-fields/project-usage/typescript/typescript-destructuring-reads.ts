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
  BindingPattern,
  Node,
  ObjectLiteralExpression,
  Type,
  TypeChecker
} from 'typescript';

import type {
  AddDeclaration,
  CandidateNames
} from '../common/project-usage.type.js';
import {
  addNamedProperties,
  addSymbolDeclarations,
  allPropertySymbols,
  propertyName
} from './typescript-symbol-reads.js';

type LazyType = () => Type;

const isBindingPattern = (node: Node): node is BindingPattern =>
  isArrayBindingPattern(node) || isObjectBindingPattern(node);

const lazyType = (compute: () => Type): LazyType => {
  let type: Type | undefined;

  return () => (type ??= compute());
};

const skippable = (
  names: string[] | null,
  nested: boolean,
  candidateNames: CandidateNames
): boolean =>
  !nested && names !== null && !names.some((name) => candidateNames.has(name));

const collectBindingPattern = (
  pattern: BindingPattern,
  type: LazyType,
  checker: TypeChecker,
  addDeclaration: AddDeclaration,
  candidateNames: CandidateNames
): void => {
  if (isArrayBindingPattern(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (isOmittedExpression(element)) {
        continue;
      }

      const names = element.dotDotDotToken ? null : [String(index)];
      const nested = isBindingPattern(element.name);

      if (skippable(names, nested, candidateNames)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type(),
        names,
        addDeclaration
      );

      if (nested) {
        for (const symbol of symbols) {
          collectBindingPattern(
            element.name,
            lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
            checker,
            addDeclaration,
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
      for (const symbol of allPropertySymbols(checker, type())) {
        if (!consumed.has(symbol.name)) {
          addSymbolDeclarations(checker, symbol, addDeclaration);
        }
      }
      continue;
    }

    const names = element.propertyName
      ? propertyName(checker, element.propertyName)
      : isIdentifier(element.name)
        ? [element.name.text]
        : null;

    for (const name of names ?? []) {
      consumed.add(name);
    }

    const nested = isBindingPattern(element.name);

    if (skippable(names, nested, candidateNames)) {
      continue;
    }

    const symbols = addNamedProperties(checker, type(), names, addDeclaration);

    if (nested) {
      for (const symbol of symbols) {
        collectBindingPattern(
          element.name,
          lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
          checker,
          addDeclaration,
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
  addDeclaration: AddDeclaration,
  candidateNames: CandidateNames
): void => {
  if (isArrayLiteralExpression(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (isOmittedExpression(element)) {
        continue;
      }

      const names = isSpreadElement(element) ? null : [String(index)];
      const nested =
        isArrayLiteralExpression(element) ||
        isObjectLiteralExpression(element);

      if (skippable(names, nested, candidateNames)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type(),
        names,
        addDeclaration
      );

      if (nested) {
        for (const symbol of symbols) {
          collectAssignmentPattern(
            element,
            lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, element)),
            checker,
            addDeclaration,
            candidateNames
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const property of pattern.properties) {
    if (isSpreadAssignment(property)) {
      for (const symbol of allPropertySymbols(checker, type())) {
        if (!consumed.has(symbol.name)) {
          addSymbolDeclarations(checker, symbol, addDeclaration);
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

    if (skippable(names, nested, candidateNames)) {
      continue;
    }

    const symbols = addNamedProperties(checker, type(), names, addDeclaration);

    if (nested) {
      for (const symbol of symbols) {
        collectAssignmentPattern(
          property.initializer,
          lazyType(() => checker.getTypeOfSymbolAtLocation(symbol, property)),
          checker,
          addDeclaration,
          candidateNames
        );
      }
    }
  }
};

export const collectDestructuringReads = (
  node: Node,
  checker: TypeChecker,
  addDeclaration: AddDeclaration,
  candidateNames: CandidateNames
): void => {
  const isDestructuringBindingPattern =
    isBindingPattern(node) &&
    !(isBindingElement(node.parent) && node.parent.name === node);

  if (isDestructuringBindingPattern) {
    const declaration = node.parent;
    const source =
      isVariableDeclaration(declaration) && declaration.initializer
        ? declaration.initializer
        : declaration;

    collectBindingPattern(
      node,
      lazyType(() => checker.getTypeAtLocation(source)),
      checker,
      addDeclaration,
      candidateNames
    );
    return;
  }

  const isDestructuringAssignment =
    isBinaryExpression(node) &&
    node.operatorToken.kind === SyntaxKind.EqualsToken &&
    (isArrayLiteralExpression(node.left) ||
      isObjectLiteralExpression(node.left));

  if (isDestructuringAssignment) {
    collectAssignmentPattern(
      node.left,
      lazyType(() => checker.getTypeAtLocation(node.right)),
      checker,
      addDeclaration,
      candidateNames
    );
  }
};
