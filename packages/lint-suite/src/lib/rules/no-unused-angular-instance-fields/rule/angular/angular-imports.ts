import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import type {
  AngularClassMetadata,
  AngularClassNode,
  AngularImport,
  AngularImports
} from '../common/no-unused-angular-instance-fields.type.ts';

const calleeRoot = (
  node: TSESTree.Expression
): TSESTree.Identifier | undefined => {
  if (node.type === TSESTree.AST_NODE_TYPES.Identifier) return node;

  if (
    node.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
    node.object.type === TSESTree.AST_NODE_TYPES.Super
  ) {
    return undefined;
  }

  return calleeRoot(node.object);
};

export const angularName = (
  node: TSESTree.Expression,
  imports: AngularImports
): AngularImport | undefined => {
  if (node.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return imports.get(node.name);
  }

  if (
    node.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
    node.computed ||
    node.property.type !== TSESTree.AST_NODE_TYPES.Identifier
  ) {
    return null;
  }

  if (node.object.type === TSESTree.AST_NODE_TYPES.Identifier) {
    const namespaceAlias = imports.get(node.object.name);

    if (namespaceAlias === null) return node.property.name;
  }

  return angularName(node.object, imports);
};

export const isImportBinding = (
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
): boolean => {
  const root = calleeRoot(node);

  if (!root) return false;

  for (
    let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(root);
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set.get(root.name);

    if (variable) return variable.defs[0]?.type === 'ImportBinding';
  }

  return false;
};

export const addAngularImport = (
  node: TSESTree.ImportDeclaration,
  imports: AngularImports
): void => {
  if (node.source.value !== '@angular/core' || node.importKind === 'type') {
    return;
  }

  for (const specifier of node.specifiers) {
    if (specifier.type === TSESTree.AST_NODE_TYPES.ImportNamespaceSpecifier) {
      imports.set(specifier.local.name, null);
    } else if (
      specifier.type === TSESTree.AST_NODE_TYPES.ImportSpecifier &&
      specifier.importKind !== 'type'
    ) {
      const { imported } = specifier;
      const isIdentifier = imported.type === TSESTree.AST_NODE_TYPES.Identifier;
      const importedName = isIdentifier ? imported.name : imported.value;

      imports.set(specifier.local.name, importedName);
    }
  }
};

export const angularClassMetadata = (
  node: AngularClassNode,
  imports: AngularImports
): AngularClassMetadata | null => {
  for (const decorator of node.decorators) {
    if (decorator.expression.type !== TSESTree.AST_NODE_TYPES.CallExpression) {
      continue;
    }

    const kind = angularName(decorator.expression.callee, imports);
    const metadata = decorator.expression.arguments.at(0);

    const isComponentOrDirective = kind === 'Component' || kind === 'Directive';

    if (
      isComponentOrDirective &&
      metadata?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
    ) {
      const classMetadata: AngularClassMetadata | null = {
        component: kind === 'Component',
        metadata
      };

      return classMetadata;
    }
  }

  return null;
};

export const angularClassImports = (
  ast: TSESTree.Program
): AngularImports | null => {
  const imports: AngularImports = new Map();

  for (const node of ast.body) {
    if (node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration) {
      addAngularImport(node, imports);
    }
  }

  for (const imported of imports.values()) {
    const isNamespaceImport = imported === null;
    const isComponent = imported === 'Component';
    const isDirective = imported === 'Directive';
    const isAngularClassImport =
      isNamespaceImport || isComponent || isDirective;

    if (isAngularClassImport) return imports;
  }

  return null;
};
