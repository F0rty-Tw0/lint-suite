import { TSESTree } from '@typescript-eslint/utils';

import { isTypeScriptExpressionWrapper } from './typescript-field-reads.ts';

const parentOf = (node: TSESTree.Node): TSESTree.Node | undefined => {
  if (node.type === TSESTree.AST_NODE_TYPES.Program) return undefined;

  return node.parent;
};

const isPatternTarget = (
  parent: TSESTree.Node | undefined,
  child: TSESTree.Node
): boolean => {
  if (parent === undefined) return false;

  if (parent.type === TSESTree.AST_NODE_TYPES.ArrayPattern) {
    return parent.elements.some((element) => element === child);
  }

  if (parent.type === TSESTree.AST_NODE_TYPES.AssignmentPattern) {
    return parent.left === child;
  }

  if (parent.type === TSESTree.AST_NODE_TYPES.ObjectPattern) {
    return parent.properties.some((property) => property === child);
  }

  if (parent.type === TSESTree.AST_NODE_TYPES.Property) {
    const isObjectPattern =
      parent.parent.type === TSESTree.AST_NODE_TYPES.ObjectPattern;

    return parent.value === child && isObjectPattern;
  }

  if (parent.type === TSESTree.AST_NODE_TYPES.RestElement) {
    return parent.argument === child;
  }

  return false;
};

const isSimpleAssignmentTarget = (
  parent: TSESTree.Node | undefined,
  current: TSESTree.Node
): boolean => {
  if (parent?.type !== TSESTree.AST_NODE_TYPES.AssignmentExpression) {
    return false;
  }

  return parent.left === current && parent.operator === '=';
};

const isLoopTarget = (
  parent: TSESTree.Node | undefined,
  current: TSESTree.Node
): boolean => {
  const isForIn = parent?.type === TSESTree.AST_NODE_TYPES.ForInStatement;
  const isForOf = parent?.type === TSESTree.AST_NODE_TYPES.ForOfStatement;
  const isLoop = isForIn || isForOf;

  if (!isLoop) return false;

  return parent.left === current;
};

const isDirectWrite = (node: TSESTree.MemberExpression): boolean => {
  let current: TSESTree.Node = node;
  let parent = parentOf(node);

  while (
    parent &&
    isTypeScriptExpressionWrapper(parent) &&
    parent.expression === current
  ) {
    current = parent;
    parent = parentOf(parent);
  }

  const isDeleteExpression =
    parent?.type === TSESTree.AST_NODE_TYPES.UnaryExpression &&
    parent.operator === 'delete';
  const isAssignment = isSimpleAssignmentTarget(parent, current);

  return isAssignment || isDeleteExpression;
};

const isDestructuringOrLoopTarget = (
  node: TSESTree.MemberExpression
): boolean => {
  let current: TSESTree.Node = node;
  let parent = parentOf(node);
  let patternTarget = false;

  while (parent) {
    const wrapper =
      isTypeScriptExpressionWrapper(parent) && parent.expression === current;
    const pattern = isPatternTarget(parent, current);

    if (!wrapper && !pattern) break;

    if (pattern) {
      patternTarget = true;
    }

    current = parent;
    parent = parentOf(parent);
  }

  const isAssignedPattern =
    patternTarget && isSimpleAssignmentTarget(parent, current);

  return isAssignedPattern || isLoopTarget(parent, current);
};

export const isWriteOnly = (node: TSESTree.MemberExpression): boolean => {
  const isWrite = isDirectWrite(node);

  if (isWrite) return true;

  return isDestructuringOrLoopTarget(node);
};
