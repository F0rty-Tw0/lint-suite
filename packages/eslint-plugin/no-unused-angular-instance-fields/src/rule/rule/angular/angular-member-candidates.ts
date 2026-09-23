import { TSESTree } from '@typescript-eslint/utils';

import {
  isAngularComponentRefField,
  isCandidateDecoratedField,
  isInputField,
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
  options: FieldCandidateOptions
): boolean => {
  const isModified = node.static || node.declare || node.override;

  if (isModified) return true;

  const isDecorated = node.decorators.length > 0;
  const isOtherDecorated =
    isDecorated && !isCandidateDecoratedField(node, options.imports);

  if (isOtherDecorated) return true;

  const isObservedInput =
    options.observesInputChanges && isInputField(node, options.imports);

  if (isObservedInput) return true;

  const isComponentRef = isAngularComponentRefField(node, options.sourceCode);

  if (isComponentRef) return true;

  const isNonPrivate = node.accessibility !== 'private';

  return options.localPrivateOnly && isNonPrivate;
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

const isNgOnChanges = (node: TSESTree.ClassElement): boolean => {
  return isInstanceMethod(node) && node.key.name === 'ngOnChanges';
};

export const declaresNgOnChanges = (node: AngularClassNode): boolean => {
  return node.body.body.some(isNgOnChanges);
};

export const fieldCandidate = (
  node: TSESTree.ClassElement,
  options: FieldCandidateOptions
): MemberCandidate | null => {
  const isField = isInstanceField(node);

  if (!isField) return null;

  const isExcluded = isExcludedField(node, options);

  if (isExcluded) return null;

  const isManaged = isManagedField(
    node,
    options.imports,
    options.allowEffectFields,
    options.sourceCode,
    options.allowRxjsInteropFields
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
  const isMethod = isInstanceMethod(node);

  if (!isMethod) return null;

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
