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

import type { AddDeclaration } from '../common/project-usage.type.js';
import {
  addNamedProperties,
  addSymbolDeclarations,
  allPropertySymbols,
  propertyName
} from './typescript-symbol-reads.js';

const isBindingPattern = (node: Node): node is BindingPattern =>
  isArrayBindingPattern(node) || isObjectBindingPattern(node);

const collectBindingPattern = (
  pattern: BindingPattern,
  type: Type,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isArrayBindingPattern(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (isOmittedExpression(element)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type,
        element.dotDotDotToken ? null : [String(index)],
        addDeclaration
      );

      if (isBindingPattern(element.name)) {
        for (const symbol of symbols) {
          collectBindingPattern(
            element.name,
            checker.getTypeOfSymbolAtLocation(symbol, element),
            checker,
            addDeclaration
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const element of pattern.elements) {
    if (element.dotDotDotToken) {
      for (const symbol of allPropertySymbols(checker, type)) {
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
    const symbols = addNamedProperties(checker, type, names, addDeclaration);

    for (const name of names ?? []) {
      consumed.add(name);
    }

    if (isBindingPattern(element.name)) {
      for (const symbol of symbols) {
        collectBindingPattern(
          element.name,
          checker.getTypeOfSymbolAtLocation(symbol, element),
          checker,
          addDeclaration
        );
      }
    }
  }
};

const collectAssignmentPattern = (
  pattern: ArrayLiteralExpression | ObjectLiteralExpression,
  type: Type,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isArrayLiteralExpression(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (isOmittedExpression(element)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type,
        isSpreadElement(element) ? null : [String(index)],
        addDeclaration
      );

      if (
        isArrayLiteralExpression(element) ||
        isObjectLiteralExpression(element)
      ) {
        for (const symbol of symbols) {
          collectAssignmentPattern(
            element,
            checker.getTypeOfSymbolAtLocation(symbol, element),
            checker,
            addDeclaration
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const property of pattern.properties) {
    if (isSpreadAssignment(property)) {
      for (const symbol of allPropertySymbols(checker, type)) {
        if (!consumed.has(symbol.name)) {
          addSymbolDeclarations(checker, symbol, addDeclaration);
        }
      }
      continue;
    }

    const names = propertyName(checker, property.name);
    const symbols = addNamedProperties(checker, type, names, addDeclaration);
    const isNestedPropertyAssignment =
      isPropertyAssignment(property) &&
      (isArrayLiteralExpression(property.initializer) ||
        isObjectLiteralExpression(property.initializer));

    if (isNestedPropertyAssignment) {
      for (const symbol of symbols) {
        collectAssignmentPattern(
          property.initializer,
          checker.getTypeOfSymbolAtLocation(symbol, property),
          checker,
          addDeclaration
        );
      }
    }

    for (const name of names ?? []) {
      consumed.add(name);
    }
  }
};

export const collectDestructuringReads = (
  node: Node,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
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
      checker.getTypeAtLocation(source),
      checker,
      addDeclaration
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
      checker.getTypeAtLocation(node.right),
      checker,
      addDeclaration
    );
  }
};
