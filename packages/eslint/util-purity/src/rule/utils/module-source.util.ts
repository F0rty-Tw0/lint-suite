import { TSESTree } from '@typescript-eslint/utils';

import type { ModuleSourceNode } from '../common/util-purity.type.ts';

type ModuleReference = TSESTree.TSImportEqualsDeclaration['moduleReference'];

const { AST_NODE_TYPES } = TSESTree;

const isTypeOnly = (node: ModuleSourceNode): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.ImportDeclaration:
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return node.importKind === 'type';
    case AST_NODE_TYPES.ExportNamedDeclaration:
    case AST_NODE_TYPES.ExportAllDeclaration:
      return node.exportKind === 'type';
    case AST_NODE_TYPES.ImportExpression:
      return false;
  }
};

const externalSource = (
  reference: ModuleReference
): TSESTree.Expression | null => {
  if (reference.type !== AST_NODE_TYPES.TSExternalModuleReference) return null;

  return reference.expression;
};

const sourceExpression = (
  node: ModuleSourceNode
): TSESTree.Expression | null => {
  switch (node.type) {
    case AST_NODE_TYPES.TSImportEqualsDeclaration:
      return externalSource(node.moduleReference);
    case AST_NODE_TYPES.ImportDeclaration:
    case AST_NODE_TYPES.ExportNamedDeclaration:
    case AST_NODE_TYPES.ExportAllDeclaration:
    case AST_NODE_TYPES.ImportExpression:
      return node.source;
  }
};

const stringLiteralValue = (
  node: TSESTree.Expression | null
): string | undefined => {
  if (node?.type !== AST_NODE_TYPES.Literal) return undefined;

  if (typeof node.value !== 'string') return undefined;

  return node.value;
};

export const runtimeModuleSource = (
  node: ModuleSourceNode
): string | undefined => {
  const typeOnly = isTypeOnly(node);

  if (typeOnly) return undefined;

  const source = sourceExpression(node);
  const value = stringLiteralValue(source);

  return value;
};
