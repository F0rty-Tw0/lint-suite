import { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { angularName, isImportBinding } from './angular-imports.ts';
import type {
  AngularImport,
  AngularImports,
  InstanceField
} from '../common/no-unused-angular-instance-fields.type.ts';

const managedApis: ReadonlySet<string> = new Set(['outputFromObservable']);

const signalInputApis: ReadonlySet<string> = new Set(['input', 'model']);

const candidateDecorators: ReadonlySet<AngularImport | undefined> = new Set([
  'Input',
  'Output',
  'ViewChild',
  'ViewChildren',
  'ContentChild',
  'ContentChildren'
]);

const rxjsInteropApis: ReadonlySet<string> = new Set([
  'toObservable',
  'toSignal',
  'outputToObservable',
  'rxResource'
]);

const isManualCleanupDisabledProperty = (
  property: TSESTree.ObjectLiteralElement
): boolean => {
  if (property.type !== TSESTree.AST_NODE_TYPES.Property || property.computed) {
    return false;
  }

  const isIdentifierManualCleanup =
    property.key.type === TSESTree.AST_NODE_TYPES.Identifier &&
    property.key.name === 'manualCleanup';
  const isLiteralManualCleanup =
    property.key.type === TSESTree.AST_NODE_TYPES.Literal &&
    property.key.value === 'manualCleanup';
  const manualCleanup = isIdentifierManualCleanup || isLiteralManualCleanup;

  return (
    !manualCleanup ||
    (property.value.type === TSESTree.AST_NODE_TYPES.Literal &&
      property.value.value === false)
  );
};

const hasAutomaticEffectCleanup = (node: TSESTree.CallExpression): boolean => {
  const options = node.arguments.at(1);

  if (options === undefined) return true;

  if (options.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) return false;

  return options.properties.every(isManualCleanupDisabledProperty);
};

const angularCoreImportedName = (
  definition: TSESLint.Scope.Definition | undefined
): string | null => {
  if (definition?.type !== TSESLint.Scope.DefinitionType.ImportBinding)
    return null;

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

  const scope = sourceCode.getScope(type.typeName);
  const reference = scope.references.find(
    ({ identifier }) => identifier === type.typeName
  );
  const definition = reference?.resolved?.defs[0];

  return angularCoreImportedName(definition) === 'ComponentRef';
};

export const isManagedField = (
  node: InstanceField,
  imports: AngularImports,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode,
  allowRxjsInteropFields: boolean
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  const name = angularName(node.value.callee, imports);
  const isString = typeof name === 'string';

  if (!isString) return false;

  const isManagedApi = managedApis.has(name);

  if (isManagedApi) return true;

  if (allowRxjsInteropFields && rxjsInteropApis.has(name)) {
    return isImportBinding(node.value.callee, sourceCode);
  }

  if (!allowEffectFields) return false;

  if (name !== 'effect') return false;

  const isImported = isImportBinding(node.value.callee, sourceCode);

  if (!isImported) return false;

  return hasAutomaticEffectCleanup(node.value);
};

const decoratorName = (
  decorator: TSESTree.Decorator,
  imports: AngularImports
): AngularImport | undefined => {
  if (decorator.expression.type !== TSESTree.AST_NODE_TYPES.CallExpression) {
    return undefined;
  }

  return angularName(decorator.expression.callee, imports);
};

const decoratorNames = (
  node: InstanceField,
  imports: AngularImports
): (AngularImport | undefined)[] => {
  return node.decorators.map((decorator) => decoratorName(decorator, imports));
};

const isEventEmitterValue = (
  node: InstanceField,
  imports: AngularImports
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.NewExpression) return false;

  return angularName(node.value.callee, imports) === 'EventEmitter';
};

export const isCandidateDecoratedField = (
  node: InstanceField,
  imports: AngularImports
): boolean => {
  const names = decoratorNames(node, imports);
  const isCandidate = names.every((name) => candidateDecorators.has(name));

  if (!isCandidate) return false;

  const isOutput = names.includes('Output');

  if (!isOutput) return true;

  return isEventEmitterValue(node, imports);
};

export const isInputField = (
  node: InstanceField,
  imports: AngularImports
): boolean => {
  const names = decoratorNames(node, imports);
  const isDecoratedInput = names.includes('Input');

  if (isDecoratedInput) return true;

  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;

  const name = angularName(node.value.callee, imports);

  return typeof name === 'string' && signalInputApis.has(name);
};
