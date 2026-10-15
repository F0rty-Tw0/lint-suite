import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import type { EdgeVisitor } from './common/modular-boundaries.type.ts';

/** A string literal, or a template literal without expressions. */
const specifierOf = (node: TSESTree.Node): string | undefined => {
  if (node.type === AST_NODE_TYPES.Literal) {
    const { value } = node;

    return typeof value === 'string' ? value : undefined;
  }

  if (node.type !== AST_NODE_TYPES.TemplateLiteral) return undefined;

  if (node.expressions.length > 0) return undefined;

  return node.quasis[0]?.value.cooked ?? undefined;
};

/** The AST nodes whose specifier is one import edge. */
export const importEdgeListeners = (
  visit: EdgeVisitor
): TSESLint.RuleListener => {
  const visitSource = (node: TSESTree.Node | null): void => {
    if (node === null) return;

    const specifier = specifierOf(node);

    if (specifier !== undefined) visit(node, specifier);
  };
  const visitRequire = (node: TSESTree.CallExpression): void => {
    const { callee } = node;
    const [first] = node.arguments;
    const isRequire =
      callee.type === AST_NODE_TYPES.Identifier && callee.name === 'require';

    if (isRequire && first !== undefined) visitSource(first);
  };
  const visitImportEquals = (
    node: TSESTree.TSImportEqualsDeclaration
  ): void => {
    const reference = node.moduleReference;
    const isExternal =
      reference.type === AST_NODE_TYPES.TSExternalModuleReference;

    if (isExternal) visitSource(reference.expression);
  };
  const listeners: TSESLint.RuleListener = {
    ImportDeclaration: (node): void => visitSource(node.source),
    ExportNamedDeclaration: (node): void => visitSource(node.source),
    ExportAllDeclaration: (node): void => visitSource(node.source),
    ImportExpression: (node): void => visitSource(node.source),
    CallExpression: visitRequire,
    TSImportEqualsDeclaration: visitImportEquals,
    TSImportType: (node): void => visitSource(node.source)
  };

  return listeners;
};
