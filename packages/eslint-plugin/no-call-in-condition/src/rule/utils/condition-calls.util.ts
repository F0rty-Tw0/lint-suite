import { ASTUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import type {
  ConditionParts,
  ConstFeed
} from '../common/no-call-in-condition.type.ts';

const collectParts = (node: TSESTree.Node, parts: ConditionParts): void => {
  if (node.type === TSESTree.AST_NODE_TYPES.CallExpression) {
    parts.calls.push(node);

    return;
  }

  if (node.type === TSESTree.AST_NODE_TYPES.Identifier) {
    parts.identifiers.push(node);

    return;
  }

  if (node.type === TSESTree.AST_NODE_TYPES.UnaryExpression) {
    collectParts(node.argument, parts);

    return;
  }

  const isLogical = node.type === TSESTree.AST_NODE_TYPES.LogicalExpression;
  const isBinary = node.type === TSESTree.AST_NODE_TYPES.BinaryExpression;

  if (!isLogical && !isBinary) return;

  collectParts(node.left, parts);
  collectParts(node.right, parts);
};

export const conditionParts = (node: TSESTree.Node): ConditionParts => {
  const parts: ConditionParts = { calls: [], identifiers: [] };

  collectParts(node, parts);

  return parts;
};

export const calleeName = (callee: TSESTree.Node): string | undefined => {
  if (callee.type === TSESTree.AST_NODE_TYPES.Identifier) return callee.name;

  if (callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression) {
    return undefined;
  }

  const { property } = callee;

  if (property.type !== TSESTree.AST_NODE_TYPES.Identifier) return undefined;

  return property.name;
};

export const constFeed = (
  identifier: TSESTree.Identifier,
  scope: TSESLint.Scope.Scope
): ConstFeed | undefined => {
  const variable = ASTUtils.findVariable(scope, identifier);

  if (variable?.defs.length !== 1) return undefined;

  const definition = variable.defs.at(0);

  if (!definition) return undefined;

  const declaration = definition.parent;

  if (declaration?.type !== TSESTree.AST_NODE_TYPES.VariableDeclaration) {
    return undefined;
  }

  if (declaration.kind !== 'const') return undefined;

  const { node } = definition;

  if (node.type !== TSESTree.AST_NODE_TYPES.VariableDeclarator) {
    return undefined;
  }

  const { init } = node;

  if (!init) return undefined;

  if (init.type === TSESTree.AST_NODE_TYPES.CallExpression) return undefined;

  const feed: ConstFeed = { init, statement: declaration };

  return feed;
};
