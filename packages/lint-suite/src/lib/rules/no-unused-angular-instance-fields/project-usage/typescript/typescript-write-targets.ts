import {
  SyntaxKind,
  isArrayLiteralExpression,
  isAsExpression,
  isBinaryExpression,
  isDeleteExpression,
  isForInStatement,
  isForOfStatement,
  isNonNullExpression,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isPropertyAssignment,
  isSatisfiesExpression,
  isSpreadAssignment,
  isTypeAssertionExpression
} from 'typescript';
import type { Expression, Node } from 'typescript';

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

const isWriteTarget = (parent: Node, current: Node): boolean => {
  const isBinary = isBinaryExpression(parent);
  const isBinaryTarget =
    isBinary &&
    parent.left === current &&
    parent.operatorToken.kind === SyntaxKind.EqualsToken;

  if (isBinaryTarget) return true;

  const isDelete = isDeleteExpression(parent);
  const isDeleteTarget = isDelete && parent.expression === current;

  if (isDeleteTarget) return true;

  const isForIn = isForInStatement(parent);
  const isForOf = isForOfStatement(parent);
  const isIteration = isForIn || isForOf;

  return isIteration && parent.initializer === current;
};

/**
 * True when every use of `node` up through its wrapping expressions and
 * destructuring patterns writes to it rather than reading it.
 */
export const isWriteOnly = (node: Expression): boolean => {
  let current: Node = node;
  let parent = node.parent;

  while (
    isExpressionWrapper(parent, current) ||
    isPatternContainer(parent, current)
  ) {
    current = parent;
    parent = parent.parent;
  }

  return isWriteTarget(parent, current);
};
