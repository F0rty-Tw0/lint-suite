import { TSESTree } from '@typescript-eslint/utils';

type BodyContainer =
  TSESTree.BlockStatement | TSESTree.Program | TSESTree.StaticBlock;

const isBodyContainer = (node: TSESTree.Node): node is BodyContainer => {
  return (
    node.type === TSESTree.AST_NODE_TYPES.Program ||
    node.type === TSESTree.AST_NODE_TYPES.BlockStatement ||
    node.type === TSESTree.AST_NODE_TYPES.StaticBlock
  );
};

export const enclosingStatement = (node: TSESTree.Node): TSESTree.Node => {
  let current = node;

  for (;;) {
    const { parent } = current;

    if (!parent || isBodyContainer(parent)) return current;

    current = parent;
  }
};
