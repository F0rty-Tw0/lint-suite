import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { angularName, isImportBinding } from './angular-imports.js';
import type {
  AngularImports,
  InstanceField
} from '../common/no-unused-angular-instance-fields.type.js';

const managedApis: Readonly<Record<string, true>> = {
  input: true,
  model: true,
  output: true,
  viewChild: true,
  viewChildren: true,
  contentChild: true,
  contentChildren: true
};

const hasAutomaticEffectCleanup = (node: TSESTree.CallExpression): boolean => {
  const options = node.arguments[1];

  if (options === undefined) return true;

  if (options.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) return false;

  return options.properties.every((property) => {
    if (
      property.type !== TSESTree.AST_NODE_TYPES.Property ||
      property.computed
    ) {
      return false;
    }

    const manualCleanup =
      (property.key.type === TSESTree.AST_NODE_TYPES.Identifier &&
        property.key.name === 'manualCleanup') ||
      (property.key.type === TSESTree.AST_NODE_TYPES.Literal &&
        property.key.value === 'manualCleanup');

    return (
      !manualCleanup ||
      (property.value.type === TSESTree.AST_NODE_TYPES.Literal &&
        property.value.value === false)
    );
  });
};

export const isAngularComponentRefField = (
  node: InstanceField,
  sourceCode: TSESLint.SourceCode
): boolean => {
  const type = node.typeAnnotation?.typeAnnotation;

  if (
    type?.type !== TSESTree.AST_NODE_TYPES.TSTypeReference ||
    type.typeName.type !== TSESTree.AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  const reference = sourceCode
    .getScope(type.typeName)
    .references.find(({ identifier }) => identifier === type.typeName);
  const variable = reference?.resolved;
  const definition = variable?.defs[0];

  return (
    definition?.type === 'ImportBinding' &&
    definition.node.type === TSESTree.AST_NODE_TYPES.ImportSpecifier &&
    definition.parent?.type === TSESTree.AST_NODE_TYPES.ImportDeclaration &&
    definition.parent.source.value === '@angular/core' &&
    ((definition.node.imported.type === TSESTree.AST_NODE_TYPES.Identifier &&
      definition.node.imported.name === 'ComponentRef') ||
      (definition.node.imported.type === TSESTree.AST_NODE_TYPES.Literal &&
        definition.node.imported.value === 'ComponentRef'))
  );
};

export const isManagedField = (
  node: InstanceField,
  imports: AngularImports,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  const name = angularName(node.value.callee, imports);

  return (
    (typeof name === 'string' && managedApis[name] === true) ||
    (allowEffectFields &&
      name === 'effect' &&
      isImportBinding(node.value.callee, sourceCode) &&
      hasAutomaticEffectCleanup(node.value))
  );
};
