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
  Declaration,
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

const isExpressionWrapper = (parent: Node, child: Node): boolean => {
  const isParenthesized = isParenthesizedExpression(parent);
  const isAs = isAsExpression(parent);
  const isTypeAssertion = isTypeAssertionExpression(parent);
  const isNonNull = isNonNullExpression(parent);
  const isSatisfies = isSatisfiesExpression(parent);
  const isCast = isAs || isTypeAssertion || isSatisfies;
  const isWrapper = isParenthesized || isNonNull || isCast;

  if (!isWrapper) return false;

  return parent.expression === child;
};

const isPatternContainer = (parent: Node, child: Node): boolean => {
  const isArrayLiteral = isArrayLiteralExpression(parent);

  if (isArrayLiteral) {
    return parent.elements.some((element) => element === child);
  }

  const isObjectLiteral = isObjectLiteralExpression(parent);

  if (isObjectLiteral) {
    return parent.properties.some((property) => property === child);
  }

  const isAssignment = isPropertyAssignment(parent);

  if (isAssignment) return parent.initializer === child;

  const isSpread = isSpreadAssignment(parent);

  if (!isSpread) return false;

  return parent.expression === child;
};

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
  const isCandidateName = candidateNames.has(node.name.text);

  if (!isCandidateName) return;

  const isWriteTarget = isWriteOnly(node);

  if (isWriteTarget) return;

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
  const isWriteTarget = isWriteOnly(node);

  if (isWriteTarget || !node.argumentExpression) return;

  const names = literalPropertyNames(
    checker.getTypeAtLocation(node.argumentExpression)
  );

  if (names) {
    const hasCandidateName = names.some((name) => candidateNames.has(name));

    if (!hasCandidateName) return;
  }

  addNamedProperties(
    checker,
    checker.getTypeAtLocation(node.expression),
    names,
    sink
  );
};

const isAngularMethodSignature = (declaration: Declaration): boolean => {
  const isMethod = isMethodSignature(declaration);

  if (!isMethod) return false;

  const fileName = declaration.getSourceFile().fileName.replaceAll('\\', '/');

  return fileName.includes('/node_modules/@angular/');
};

const isAngularInterfaceMethod = (symbol: Symbol): boolean => {
  const declarations = symbol.declarations ?? [];

  return declarations.some(isAngularMethodSignature);
};

const collectAngularInterfaceMethods = (
  node: ClassLikeDeclaration,
  checker: TypeChecker,
  sink: ReadSink
): void => {
  const heritageClauses = node.heritageClauses ?? [];
  const implementsClauses = heritageClauses.filter(
    (clause) => clause.token === SyntaxKind.ImplementsKeyword
  );

  if (implementsClauses.length === 0) return;

  const classType = checker.getTypeAtLocation(node);

  for (const clause of implementsClauses) {
    for (const heritageType of clause.types) {
      const type = checker.getTypeAtLocation(heritageType);

      sink.addType(type);

      for (const interfaceMethod of type.getProperties()) {
        const isInterfaceMethod = isAngularInterfaceMethod(interfaceMethod);

        if (!isInterfaceMethod) continue;

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
    const isClass = isClassLike(node);

    if (isClass) {
      const isDecoratable = canHaveDecorators(node);

      if (isDecoratable) {
        const decorators = getDecorators(node);
        const decoratorCount = decorators?.length ?? 0;
        const isDecoratedClass = decoratorCount > 0;

        if (isDecoratedClass) {
          for (const member of node.members) {
            if (!member.name) continue;

            const isIdentifierName = isIdentifier(member.name);
            const isStringName = isStringLiteralLike(member.name);
            const isNamedMember = isIdentifierName || isStringName;

            if (isNamedMember) {
              names.add(member.name.text);
            }
          }
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
    const isPropertyAccess = isPropertyAccessExpression(node);
    const isElementAccess = isElementAccessExpression(node);
    const isClass = isClassLike(node);

    if (isPropertyAccess) {
      addPropertyAccessRead(node, checker, sink, candidateNames);
    } else if (isElementAccess) {
      addElementAccessRead(node, checker, sink, candidateNames);
    } else if (isClass) {
      collectAngularInterfaceMethods(node, checker, sink);
    }

    collectDestructuringReads(node, checker, sink, candidateNames);
    forEachChild(node, visit);
  };

  visit(sourceFile);
};
