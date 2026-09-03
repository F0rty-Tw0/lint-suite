import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  isAngularComponentRefField,
  isManagedField
} from './angular-managed-fields.js';
import type {
  AngularClassNode,
  AngularImports,
  InstanceField,
  InstanceMethod,
  MemberCandidate
} from '../common/no-unused-angular-instance-fields.type.js';

const lifecycleHooks: Readonly<Record<string, true>> = {
  ngOnChanges: true,
  ngOnInit: true,
  ngDoCheck: true,
  ngAfterContentInit: true,
  ngAfterContentChecked: true,
  ngAfterViewInit: true,
  ngAfterViewChecked: true,
  ngOnDestroy: true
};

const formsInterfaceMethods: Readonly<Record<string, string[]>> = {
  AsyncValidator: ['validate', 'registerOnValidatorChange'],
  ControlValueAccessor: [
    'writeValue',
    'registerOnChange',
    'registerOnTouched',
    'setDisabledState'
  ],
  Validator: ['validate', 'registerOnValidatorChange']
};

const isInstanceField = (node: TSESTree.ClassElement): node is InstanceField =>
  node.type === TSESTree.AST_NODE_TYPES.PropertyDefinition &&
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier;

const isInstanceMethod = (
  node: TSESTree.ClassElement
): node is InstanceMethod =>
  node.type === TSESTree.AST_NODE_TYPES.MethodDefinition &&
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier;

const isExcludedField = (
  node: InstanceField,
  localPrivateOnly: boolean,
  sourceCode: TSESLint.SourceCode
): boolean =>
  node.static ||
  node.declare ||
  node.override ||
  node.decorators.length > 0 ||
  isAngularComponentRefField(node, sourceCode) ||
  (localPrivateOnly && node.accessibility !== 'private');

const isExcludedMethod = (
  node: InstanceMethod,
  localPrivateOnly: boolean,
  implementedMethods: Set<string>
): boolean =>
  node.static ||
  node.override ||
  node.decorators.length > 0 ||
  node.computed ||
  node.kind !== 'method' ||
  node.value.body === null ||
  lifecycleHooks[node.key.name] === true ||
  implementedMethods.has(node.key.name) ||
  (localPrivateOnly && node.accessibility !== 'private');

export const implementedFormsMethods = (
  node: AngularClassNode
): Set<string> => {
  const methods = new Set<string>();

  for (const heritage of node.implements) {
    if (heritage.expression.type !== TSESTree.AST_NODE_TYPES.Identifier) {
      continue;
    }

    for (const name of formsInterfaceMethods[heritage.expression.name] ?? []) {
      methods.add(name);
    }
  }

  return methods;
};

export const fieldCandidate = (
  node: TSESTree.ClassElement,
  imports: AngularImports,
  localPrivateOnly: boolean,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode
): MemberCandidate | null => {
  if (
    isInstanceField(node) &&
    !isExcludedField(node, localPrivateOnly, sourceCode) &&
    !isManagedField(node, imports, allowEffectFields, sourceCode)
  ) {
    return { messageId: 'unusedField', name: node.key.name, node };
  }

  return null;
};

export const methodCandidate = (
  node: TSESTree.ClassElement,
  localPrivateOnly: boolean,
  implementedMethods: Set<string>
): MemberCandidate | null => {
  if (
    isInstanceMethod(node) &&
    !isExcludedMethod(node, localPrivateOnly, implementedMethods)
  ) {
    return { messageId: 'unusedMethod', name: node.key.name, node };
  }

  return null;
};
