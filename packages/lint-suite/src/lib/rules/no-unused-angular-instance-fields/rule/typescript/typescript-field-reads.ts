import { TSESTree } from '@typescript-eslint/utils';

type TypeScriptExpressionWrapper =
  | TSESTree.TSAsExpression
  | TSESTree.TSInstantiationExpression
  | TSESTree.TSNonNullExpression
  | TSESTree.TSSatisfiesExpression
  | TSESTree.TSTypeAssertion;

type DestructuringNode =
  | TSESTree.AssignmentExpression
  | TSESTree.VariableDeclarator;

type DestructuringParts = {
  readonly pattern: TSESTree.BindingName | TSESTree.Expression;
  readonly source: TSESTree.Expression | null;
};

const isTypeScriptExpressionWrapper = (
  node: TSESTree.Node
): node is TypeScriptExpressionWrapper => {
  switch (node.type) {
    case TSESTree.AST_NODE_TYPES.TSAsExpression:
    case TSESTree.AST_NODE_TYPES.TSInstantiationExpression:
    case TSESTree.AST_NODE_TYPES.TSNonNullExpression:
    case TSESTree.AST_NODE_TYPES.TSSatisfiesExpression:
    case TSESTree.AST_NODE_TYPES.TSTypeAssertion:
      return true;
    default:
      return false;
  }
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

export const isThisExpression = (
  node: TSESTree.Expression | null
): boolean =>
  unwrapTypeScriptExpression(node)?.type ===
  TSESTree.AST_NODE_TYPES.ThisExpression;

const isPatternTarget = (
  parent: TSESTree.Node | undefined,
  child: TSESTree.Node
): boolean => {
  switch (parent?.type) {
    case TSESTree.AST_NODE_TYPES.ArrayPattern:
      return parent.elements.some((element) => element === child);
    case TSESTree.AST_NODE_TYPES.AssignmentPattern:
      return parent.left === child;
    case TSESTree.AST_NODE_TYPES.ObjectPattern:
      return parent.properties.some((property) => property === child);
    case TSESTree.AST_NODE_TYPES.Property:
      return (
        parent.value === child &&
        parent.parent.type === TSESTree.AST_NODE_TYPES.ObjectPattern
      );
    case TSESTree.AST_NODE_TYPES.RestElement:
      return parent.argument === child;
    default:
      return false;
  }
};

const isSimpleAssignmentTarget = (
  parent: TSESTree.Node | undefined,
  current: TSESTree.Node
): boolean =>
  parent?.type === TSESTree.AST_NODE_TYPES.AssignmentExpression &&
  parent.left === current &&
  parent.operator === '=';

const isLoopTarget = (
  parent: TSESTree.Node | undefined,
  current: TSESTree.Node
): boolean =>
  (parent?.type === TSESTree.AST_NODE_TYPES.ForInStatement ||
    parent?.type === TSESTree.AST_NODE_TYPES.ForOfStatement) &&
  parent.left === current;

const isDirectWrite = (node: TSESTree.MemberExpression): boolean => {
  let current: TSESTree.Node = node;
  let parent: TSESTree.Node | undefined = node.parent;

  while (
    parent &&
    isTypeScriptExpressionWrapper(parent) &&
    parent.expression === current
  ) {
    current = parent;
    parent = parent.parent;
  }

  return (
    isSimpleAssignmentTarget(parent, current) ||
    (parent?.type === TSESTree.AST_NODE_TYPES.UnaryExpression &&
      parent.operator === 'delete')
  );
};

const isDestructuringOrLoopTarget = (
  node: TSESTree.MemberExpression
): boolean => {
  let current: TSESTree.Node = node;
  let parent: TSESTree.Node | undefined = node.parent;
  let patternTarget = false;

  while (parent) {
    const wrapper =
      isTypeScriptExpressionWrapper(parent) && parent.expression === current;
    const pattern = isPatternTarget(parent, current);

    if (!wrapper && !pattern) {
      break;
    }

    if (pattern) {
      patternTarget = true;
    }

    current = parent;
    parent = parent.parent;
  }

  return (
    (patternTarget && isSimpleAssignmentTarget(parent, current)) ||
    isLoopTarget(parent, current)
  );
};

export const isWriteOnly = (node: TSESTree.MemberExpression): boolean =>
  isDirectWrite(node) || isDestructuringOrLoopTarget(node);

const destructuringParts = (
  node: DestructuringNode
): DestructuringParts | null => {
  if (node.type === TSESTree.AST_NODE_TYPES.VariableDeclarator) {
    return { pattern: node.id, source: node.init };
  }

  if (node.operator === '=') {
    return { pattern: node.left, source: node.right };
  }

  return null;
};

const propertyName = (
  property: TSESTree.Property | TSESTree.RestElement
): string | null => {
  if (
    property.type !== TSESTree.AST_NODE_TYPES.Property ||
    property.computed
  ) {
    return null;
  }

  if (property.key.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return property.key.name;
  }

  return property.key.type === TSESTree.AST_NODE_TYPES.Literal &&
    typeof property.key.value === 'string'
    ? property.key.value
    : null;
};

export const destructuredThisReads = (
  node: DestructuringNode
): string[] | null | undefined => {
  const parts = destructuringParts(node);

  if (
    !parts ||
    parts.pattern.type !== TSESTree.AST_NODE_TYPES.ObjectPattern ||
    !isThisExpression(parts.source)
  ) {
    return undefined;
  }

  const reads: string[] = [];

  for (const property of parts.pattern.properties) {
    const name = propertyName(property);

    if (name === null) {
      return null;
    }

    reads.push(name);
  }

  return reads;
};
