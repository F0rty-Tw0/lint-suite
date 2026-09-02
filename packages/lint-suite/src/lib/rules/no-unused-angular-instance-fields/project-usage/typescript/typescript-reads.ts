import {
  forEachChild,
  isArrayLiteralExpression,
  isAsExpression,
  isBinaryExpression,
  isClassLike,
  isDeleteExpression,
  isElementAccessExpression,
  isForInStatement,
  isForOfStatement,
  isMethodSignature,
  isNonNullExpression,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isSpreadAssignment,
  isTypeAssertionExpression,
  SyntaxKind
} from 'typescript';
import type {
  ClassLikeDeclaration,
  ElementAccessExpression,
  Expression,
  Node,
  Program,
  PropertyAccessExpression,
  Symbol,
  TypeChecker
} from 'typescript';

import type { AddDeclaration } from '../common/project-usage.type.js';
import { isSpecFile } from '../utils/spec-file.js';
import { collectDestructuringReads } from './typescript-destructuring-reads.js';
import {
  addNamedProperties,
  addSymbolDeclarations,
  literalPropertyNames
} from './typescript-symbol-reads.js';

const isExpressionWrapper = (parent: Node, child: Node): boolean =>
  (isParenthesizedExpression(parent) ||
    isAsExpression(parent) ||
    isTypeAssertionExpression(parent) ||
    isNonNullExpression(parent) ||
    isSatisfiesExpression(parent)) &&
  parent.expression === child;

const isPatternContainer = (parent: Node, child: Node): boolean =>
  (isArrayLiteralExpression(parent) &&
    parent.elements.some((element) => element === child)) ||
  (isObjectLiteralExpression(parent) &&
    parent.properties.some((property) => property === child)) ||
  (isPropertyAssignment(parent) && parent.initializer === child) ||
  (isSpreadAssignment(parent) && parent.expression === child);

const isWriteOnly = (node: Expression): boolean => {
  let current: Node = node;
  let parent = node.parent;

  while (
    parent &&
    (isExpressionWrapper(parent, current) ||
      isPatternContainer(parent, current))
  ) {
    current = parent;
    parent = parent.parent;
  }

  const isWriteOnlyBinaryAssignment =
    isBinaryExpression(parent) &&
    parent.left === current &&
    parent.operatorToken.kind === SyntaxKind.EqualsToken;
  const isWriteOnlyDelete =
    isDeleteExpression(parent) && parent.expression === current;
  const isWriteOnlyIteration =
    (isForInStatement(parent) || isForOfStatement(parent)) &&
    parent.initializer === current;

  return (
    isWriteOnlyBinaryAssignment ||
    isWriteOnlyDelete ||
    isWriteOnlyIteration
  );
};

const addPropertyAccessRead = (
  node: PropertyAccessExpression,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isWriteOnly(node)) {
    return;
  }

  const symbol = checker.getSymbolAtLocation(node.name);

  if (symbol) {
    addSymbolDeclarations(checker, symbol, addDeclaration);
  }
};

const addElementAccessRead = (
  node: ElementAccessExpression,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isWriteOnly(node) || !node.argumentExpression) {
    return;
  }

  addNamedProperties(
    checker,
    checker.getTypeAtLocation(node.expression),
    literalPropertyNames(checker.getTypeAtLocation(node.argumentExpression)),
    addDeclaration
  );
};

const isAngularInterfaceMethod = (symbol: Symbol): boolean =>
  (symbol.declarations ?? []).some(
    (declaration) =>
      isMethodSignature(declaration) &&
      declaration
        .getSourceFile()
        .fileName.replaceAll('\\', '/')
        .includes('/node_modules/@angular/')
  );

const collectAngularInterfaceMethods = (
  node: ClassLikeDeclaration,
  checker: TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  const classType = checker.getTypeAtLocation(node);

  for (const clause of node.heritageClauses ?? []) {
    if (clause.token !== SyntaxKind.ImplementsKeyword) {
      continue;
    }

    for (const heritageType of clause.types) {
      const type = checker.getTypeAtLocation(heritageType);

      for (const interfaceMethod of type.getProperties()) {
        if (!isAngularInterfaceMethod(interfaceMethod)) {
          continue;
        }

        const implementation = classType.getProperty(interfaceMethod.name);

        if (implementation) {
          addSymbolDeclarations(checker, implementation, addDeclaration);
        }
      }
    }
  }
};

export const collectTypeScriptReads = (
  program: Program,
  addDeclaration: AddDeclaration
): void => {
  const checker = program.getTypeChecker();

  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node)) {
      addPropertyAccessRead(node, checker, addDeclaration);
    } else if (isElementAccessExpression(node)) {
      addElementAccessRead(node, checker, addDeclaration);
    } else if (isClassLike(node)) {
      collectAngularInterfaceMethods(node, checker, addDeclaration);
    }

    collectDestructuringReads(node, checker, addDeclaration);
    forEachChild(node, visit);
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (
      !sourceFile.isDeclarationFile &&
      !program.isSourceFileFromExternalLibrary(sourceFile) &&
      !isSpecFile(sourceFile.fileName) &&
      /\.(?:[cm]?ts|tsx)$/u.test(sourceFile.fileName)
    ) {
      visit(sourceFile);
    }
  }
};
