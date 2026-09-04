import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  isAngularComponentRefField,
  isManagedField
} from './angular-managed-fields.ts';
import type {
  AngularClassNode,
  FieldCandidateOptions,
  InstanceField,
  InstanceMethod,
  MemberCandidate
} from '../common/no-unused-angular-instance-fields.type.ts';

const lifecycleHooks: ReadonlySet<string> = new Set([
  'ngOnChanges',
  'ngOnInit',
  'ngDoCheck',
  'ngAfterContentInit',
  'ngAfterContentChecked',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngOnDestroy'
]);

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

const isInstanceField = (
  node: TSESTree.ClassElement
): node is InstanceField => {
  if (node.type !== TSESTree.AST_NODE_TYPES.PropertyDefinition) return false;

  return node.key.type === TSESTree.AST_NODE_TYPES.Identifier;
};

const isInstanceMethod = (
  node: TSESTree.ClassElement
): node is InstanceMethod => {
  if (node.type !== TSESTree.AST_NODE_TYPES.MethodDefinition) return false;

  return node.key.type === TSESTree.AST_NODE_TYPES.Identifier;
};

const isExcludedField = (
  node: InstanceField,
  localPrivateOnly: boolean,
  sourceCode: TSESLint.SourceCode
): boolean => {
  const isModified = node.static || node.declare || node.override;
  const isDecorated = node.decorators.length > 0;

  if (isModified || isDecorated) return true;

  const isComponentRef = isAngularComponentRefField(node, sourceCode);

  if (isComponentRef) return true;

  const isNonPrivate = node.accessibility !== 'private';

  return localPrivateOnly && isNonPrivate;
};

const isExcludedMethod = (
  node: InstanceMethod,
  localPrivateOnly: boolean,
  implementedMethods: Set<string>
): boolean => {
  const isModified = node.static || node.override || node.computed;
  const isDecorated = node.decorators.length > 0;
  const isPlainMethod = node.kind === 'method';

  if (isModified || isDecorated || !isPlainMethod) return true;

  const hasNoBody = node.value.body === null;
  const isLifecycleHook = lifecycleHooks.has(node.key.name);

  if (hasNoBody || isLifecycleHook) return true;

  const isImplemented = implementedMethods.has(node.key.name);

  if (isImplemented) return true;

  const isNonPrivate = node.accessibility !== 'private';

  return localPrivateOnly && isNonPrivate;
};

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
  options: FieldCandidateOptions
): MemberCandidate | null => {
  if (!isInstanceField(node)) return null;

  const { localPrivateOnly, sourceCode } = options;
  const isExcluded = isExcludedField(node, localPrivateOnly, sourceCode);

  if (isExcluded) return null;

  const isManaged = isManagedField(
    node,
    options.imports,
    options.allowEffectFields,
    sourceCode
  );

  if (isManaged) return null;

  const unusedFieldCandidate: MemberCandidate | null = {
    messageId: 'unusedField',
    name: node.key.name,
    node
  };

  return unusedFieldCandidate;
};

export const methodCandidate = (
  node: TSESTree.ClassElement,
  localPrivateOnly: boolean,
  implementedMethods: Set<string>
): MemberCandidate | null => {
  if (!isInstanceMethod(node)) return null;

  const isExcluded = isExcludedMethod(
    node,
    localPrivateOnly,
    implementedMethods
  );

  if (isExcluded) return null;

  const unusedMethodCandidate: MemberCandidate | null = {
    messageId: 'unusedMethod',
    name: node.key.name,
    node
  };

  return unusedMethodCandidate;
};
