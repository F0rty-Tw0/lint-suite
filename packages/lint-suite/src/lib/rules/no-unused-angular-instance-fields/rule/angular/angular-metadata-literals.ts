import { TSESTree } from '@typescript-eslint/utils';

export const text = (
  node: TSESTree.Node | null | undefined
): string | null => {
  if (
    node?.type === TSESTree.AST_NODE_TYPES.Literal &&
    typeof node.value === 'string'
  ) {
    return node.value;
  }

  if (node?.type !== TSESTree.AST_NODE_TYPES.TemplateLiteral) return null;

  const hasExpressions = node.expressions.length > 0;

  if (hasExpressions) return null;

  return node.quasis[0].value.cooked;
};

export const key = (
  property: TSESTree.ObjectLiteralElement
): string | null => {
  if (property.type !== TSESTree.AST_NODE_TYPES.Property || property.computed) {
    return null;
  }

  if (property.key.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return property.key.name;
  }

  return text(property.key);
};

export const metadataValue = (
  metadata: TSESTree.ObjectExpression,
  name: string
): TSESTree.Property['value'] | undefined => {
  for (const property of metadata.properties) {
    if (property.type !== TSESTree.AST_NODE_TYPES.Property) continue;

    const propertyKey = key(property);

    if (propertyKey === name) return property.value;
  }

  return undefined;
};
