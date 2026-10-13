import { TSESTree } from '@typescript-eslint/utils';

const MAX_DECORATOR_OBJECT_HOPS = 3;

const isDecoratorArgument = (node: TSESTree.ObjectExpression): boolean => {
  const { parent } = node;

  if (parent.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  const { parent: grandparent } = parent;

  return grandparent.type === TSESTree.AST_NODE_TYPES.Decorator;
};

export const isInsideDecoratorConfig = (
  objectExpression: TSESTree.ObjectExpression,
  ancestors: TSESTree.Node[]
): boolean => {
  let objectHops = 0;
  const isDecoratorConfig = isDecoratorArgument(objectExpression);

  if (isDecoratorConfig) return true;

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];

    if (ancestor?.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) continue;

    objectHops += 1;

    const isAncestorDecoratorConfig = isDecoratorArgument(ancestor);

    if (isAncestorDecoratorConfig) return true;

    if (objectHops >= MAX_DECORATOR_OBJECT_HOPS) return false;
  }

  return false;
};
