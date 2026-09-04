import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isArrayLiteralExpression,
  isAsExpression,
  isBinaryExpression,
  isClassLike,
  isDeleteExpression,
  isElementAccessExpression,
  isForInStatement,
  isForOfStatement,
  isIdentifier,
  isMethodSignature,
  isNonNullExpression,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isSpreadAssignment,
  isStringLiteralLike,
  isTypeAssertionExpression,
  SyntaxKind
} from 'typescript';
import type {
  ClassLikeDeclaration,
  ElementAccessExpression,
  Expression,
  Node,
  PropertyAccessExpression,
  SourceFile,
  Symbol,
  TypeChecker
} from 'typescript';

import type { CandidateNames, ReadSink } from '../common/project-usage.type.js';
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
    isWriteOnlyBinaryAssignment || isWriteOnlyDelete || isWriteOnlyIteration
  );
};

const addPropertyAccessRead = (
  node: PropertyAccessExpression,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  if (!candidateNames.has(node.name.text) || isWriteOnly(node)) return;

  sink.addType(checker.getTypeAtLocation(node.expression));

  const symbol = checker.getSymbolAtLocation(node.name);

  if (symbol) {
    addSymbolDeclarations(checker, symbol, sink);
  }
};

const addElementAccessRead = (
  node: ElementAccessExpression,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  if (isWriteOnly(node) || !node.argumentExpression) return;

  const names = literalPropertyNames(
    checker.getTypeAtLocation(node.argumentExpression)
  );

  if (names && !names.some((name) => candidateNames.has(name))) return;

  addNamedProperties(
    checker,
    checker.getTypeAtLocation(node.expression),
    names,
    sink
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
  sink: ReadSink
): void => {
  const implementsClauses = (node.heritageClauses ?? []).filter(
    (clause) => clause.token === SyntaxKind.ImplementsKeyword
  );

  if (implementsClauses.length === 0) return;

  const classType = checker.getTypeAtLocation(node);

  for (const clause of implementsClauses) {
    for (const heritageType of clause.types) {
      const type = checker.getTypeAtLocation(heritageType);

      sink.addType(type);

      for (const interfaceMethod of type.getProperties()) {
        if (!isAngularInterfaceMethod(interfaceMethod)) continue;

        const implementation = classType.getProperty(interfaceMethod.name);

        if (implementation) {
          addSymbolDeclarations(checker, implementation, sink);
        }
      }
    }
  }
};

/** Names of members declared by decorated classes in one source file. */
export const collectCandidateNames = (sourceFile: SourceFile): Set<string> => {
  const names = new Set<string>();

  const visit = (node: Node): void => {
    if (
      isClassLike(node) &&
      canHaveDecorators(node) &&
      (getDecorators(node)?.length ?? 0) > 0
    ) {
      for (const member of node.members) {
        if (
          member.name &&
          (isIdentifier(member.name) || isStringLiteralLike(member.name))
        ) {
          names.add(member.name.text);
        }
      }
    }

    forEachChild(node, visit);
  };

  visit(sourceFile);

  return names;
};

export const collectTypeScriptReads = (
  sourceFile: SourceFile,
  checker: TypeChecker,
  sink: ReadSink,
  candidateNames: CandidateNames
): void => {
  const visit = (node: Node): void => {
    if (isPropertyAccessExpression(node)) {
      addPropertyAccessRead(node, checker, sink, candidateNames);
    } else if (isElementAccessExpression(node)) {
      addElementAccessRead(node, checker, sink, candidateNames);
    } else if (isClassLike(node)) {
      collectAngularInterfaceMethods(node, checker, sink);
    }

    collectDestructuringReads(node, checker, sink, candidateNames);
    forEachChild(node, visit);
  };

  visit(sourceFile);
};
