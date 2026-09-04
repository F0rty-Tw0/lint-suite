import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { angularName, isImportBinding } from './angular-imports.ts';
import type {
  AngularImports,
  InstanceField
} from '../common/no-unused-angular-instance-fields.type.ts';

const managedApis: ReadonlySet<string> = new Set([
  'input',
  'model',
  'output',
  'viewChild',
  'viewChildren',
  'contentChild',
  'contentChildren'
]);

const hasAutomaticEffectCleanup = (node: TSESTree.CallExpression): boolean => {
  const options = node.arguments.at(1);

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

const angularCoreImportedName = (
  definition: TSESLint.Scope.Definition | undefined
): string | null => {
  if (definition?.type !== 'ImportBinding') return null;

  if (definition.node.type !== TSESTree.AST_NODE_TYPES.ImportSpecifier) {
    return null;
  }

  if (definition.parent.type !== TSESTree.AST_NODE_TYPES.ImportDeclaration) {
    return null;
  }

  if (definition.parent.source.value !== '@angular/core') return null;

  const { imported } = definition.node;

  if (imported.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return imported.name;
  }

  return imported.value;
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
  const definition = reference?.resolved?.defs[0];

  return angularCoreImportedName(definition) === 'ComponentRef';
};

export const isManagedField = (
  node: InstanceField,
  imports: AngularImports,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  const name = angularName(node.value.callee, imports);
  const isString = typeof name === 'string';

  if (!isString) return false;

  const isManagedApi = managedApis.has(name);

  if (isManagedApi) return true;

  if (!allowEffectFields) return false;

  if (name !== 'effect') return false;

  const isImported = isImportBinding(node.value.callee, sourceCode);

  if (!isImported) return false;

  return hasAutomaticEffectCleanup(node.value);
};
