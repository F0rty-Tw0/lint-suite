import { TSESTree } from '@typescript-eslint/utils';

type TypeScriptExpressionWrapper =
  | TSESTree.TSAsExpression
  | TSESTree.TSInstantiationExpression
  | TSESTree.TSNonNullExpression
  | TSESTree.TSSatisfiesExpression
  | TSESTree.TSTypeAssertion;

type DestructuringNode =
  TSESTree.AssignmentExpression | TSESTree.VariableDeclarator;

type DestructuringParts = {
  readonly pattern: TSESTree.BindingName | TSESTree.Expression;
  readonly source: TSESTree.Expression | null;
};

const expressionWrapperTypes: ReadonlySet<TSESTree.AST_NODE_TYPES> = new Set([
  TSESTree.AST_NODE_TYPES.TSAsExpression,
  TSESTree.AST_NODE_TYPES.TSInstantiationExpression,
  TSESTree.AST_NODE_TYPES.TSNonNullExpression,
  TSESTree.AST_NODE_TYPES.TSSatisfiesExpression,
  TSESTree.AST_NODE_TYPES.TSTypeAssertion
]);

export const isTypeScriptExpressionWrapper = (
  node: TSESTree.Node
): node is TypeScriptExpressionWrapper => {
  return expressionWrapperTypes.has(node.type);
};

const unwrapTypeScriptExpression = (
  node: TSESTree.Expression | null
): TSESTree.Expression | null => {
  let current = node;

  while (current && isTypeScriptExpressionWrapper(current)) {
    current = current.expression;
  }

  return current;
};

export const isThisExpression = (node: TSESTree.Expression | null): boolean => {
  const unwrapped = unwrapTypeScriptExpression(node);

  return unwrapped?.type === TSESTree.AST_NODE_TYPES.ThisExpression;
};

const destructuringParts = (
  node: DestructuringNode
): DestructuringParts | null => {
  if (node.type === TSESTree.AST_NODE_TYPES.VariableDeclarator) {
    const variableParts: DestructuringParts | null = {
      pattern: node.id,
      source: node.init
    };

    return variableParts;
  }

  if (node.operator === '=') {
    const assignmentParts: DestructuringParts | null = {
      pattern: node.left,
      source: node.right
    };

    return assignmentParts;
  }

  return null;
};

const propertyName = (
  property: TSESTree.Property | TSESTree.RestElement
): string | null => {
  if (property.type !== TSESTree.AST_NODE_TYPES.Property || property.computed) {
    return null;
  }

  if (property.key.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return property.key.name;
  }

  const { value } = property.key;

  if (typeof value !== 'string') return null;

  return value;
};

export const destructuredThisReads = (
  node: DestructuringNode
): string[] | null | undefined => {
  const parts = destructuringParts(node);

  if (!parts) return undefined;

  if (parts.pattern.type !== TSESTree.AST_NODE_TYPES.ObjectPattern) {
    return undefined;
  }

  const isThisSource = isThisExpression(parts.source);

  if (!isThisSource) return undefined;

  const reads: string[] = [];

  for (const property of parts.pattern.properties) {
    const name = propertyName(property);

    if (name === null) return null;

    reads.push(name);
  }

  return reads;
};
