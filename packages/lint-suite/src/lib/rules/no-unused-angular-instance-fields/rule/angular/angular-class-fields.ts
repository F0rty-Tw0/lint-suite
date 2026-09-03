import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { metadataReads } from './angular-metadata-reads.js';
import type {
  AngularClassNode,
  AngularImport,
  AngularImports,
  ClassEntry,
  DynamicClasses,
  ProjectMemberUsed,
  RuleOptions
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

type InstanceField = TSESTree.PropertyDefinition & {
  readonly key: TSESTree.Identifier;
};
type InstanceMethod = TSESTree.MethodDefinition & {
  readonly key: TSESTree.Identifier;
};
type RuleContext = Readonly<
  TSESLint.RuleContext<'unusedField' | 'unusedMethod', [RuleOptions]>
>;

type AngularClass = {
  readonly component: boolean;
  readonly metadata: TSESTree.ObjectExpression;
};

type MemberCandidate = {
  readonly messageId: 'unusedField' | 'unusedMethod';
  readonly name: string;
  readonly node: InstanceField | InstanceMethod;
};

const angularName = (
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

  if (
    node.object.type === TSESTree.AST_NODE_TYPES.Identifier &&
    imports.get(node.object.name) === null
  ) {
    return node.property.name;
  }

  return angularName(node.object, imports);
};

const calleeRoot = (
  node: TSESTree.Expression
): TSESTree.Identifier | undefined => {
  if (node.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return node;
  }

  if (
    node.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
    node.object.type === TSESTree.AST_NODE_TYPES.Super
  ) {
    return undefined;
  }

  return calleeRoot(node.object);
};

const isImportBinding = (
  node: TSESTree.Expression,
  sourceCode: TSESLint.SourceCode
): boolean => {
  const root = calleeRoot(node);

  if (!root) {
    return false;
  }

  for (
    let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(root);
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set.get(root.name);

    if (variable) {
      return variable.defs[0]?.type === 'ImportBinding';
    }
  }

  return false;
};

const angularClass = (
  node: AngularClassNode,
  imports: AngularImports
): AngularClass | null => {
  for (const decorator of node.decorators) {
    if (decorator.expression.type !== TSESTree.AST_NODE_TYPES.CallExpression) {
      continue;
    }

    const kind = angularName(decorator.expression.callee, imports);
    const metadata = decorator.expression.arguments[0];

    if (
      (kind === 'Component' || kind === 'Directive') &&
      metadata?.type === TSESTree.AST_NODE_TYPES.ObjectExpression
    ) {
      return {
        component: kind === 'Component',
        metadata
      };
    }
  }

  return null;
};

const isInstanceField = (node: TSESTree.ClassElement): node is InstanceField =>
  node.type === TSESTree.AST_NODE_TYPES.PropertyDefinition &&
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier;

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

const formsInterfaceMethods: Readonly<Record<string, readonly string[]>> = {
  AsyncValidator: ['validate', 'registerOnValidatorChange'],
  ControlValueAccessor: [
    'writeValue',
    'registerOnChange',
    'registerOnTouched',
    'setDisabledState'
  ],
  Validator: ['validate', 'registerOnValidatorChange']
};

const implementedFormsMethods = (node: AngularClassNode): Set<string> => {
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

const isInstanceMethod = (
  node: TSESTree.ClassElement
): node is InstanceMethod =>
  node.type === TSESTree.AST_NODE_TYPES.MethodDefinition &&
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier;

const isAngularComponentRefField = (
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

const hasAutomaticEffectCleanup = (node: TSESTree.CallExpression): boolean => {
  const options = node.arguments[1];

  if (options === undefined) {
    return true;
  }

  if (options.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

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

const isManagedField = (
  node: InstanceField,
  imports: AngularImports,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const name = angularName(node.value.callee, imports);

  return (
    (typeof name === 'string' && managedApis[name] === true) ||
    (allowEffectFields &&
      name === 'effect' &&
      isImportBinding(node.value.callee, sourceCode) &&
      hasAutomaticEffectCleanup(node.value))
  );
};

const field = (
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

const method = (
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
      const importedName =
        specifier.imported.type === TSESTree.AST_NODE_TYPES.Identifier
          ? specifier.imported.name
          : specifier.imported.value;

      imports.set(specifier.local.name, importedName);
    }
  }
};

export const reportUnusedMembers = (
  context: RuleContext,
  imports: AngularImports,
  classes: ClassEntry[],
  dynamicClasses: DynamicClasses,
  allowEffectFields: boolean,
  projectMemberUsed: ProjectMemberUsed | undefined,
  projectIndexed: () => boolean = () => false
): void => {
  const projectAnalysis = projectMemberUsed !== undefined;
  // ponytail: local template reads short-circuit project lookups, but once
  // the project index already covers this Program they only repeat work.
  const localTemplates = !projectAnalysis || !projectIndexed();

  for (const entry of classes) {
    const ngClass = angularClass(entry.node, imports);

    if (!ngClass || dynamicClasses.has(entry)) {
      continue;
    }

    // ponytail: local analysis cannot see subclasses, so directive and
    // abstract-class members are only candidates when private.
    const localPrivateOnly =
      !projectAnalysis && (!ngClass.component || entry.node.abstract === true);
    const implementedMethods = implementedFormsMethods(entry.node);
    const members: MemberCandidate[] = [];

    for (const node of entry.node.body.body) {
      const candidate =
        field(
          node,
          imports,
          localPrivateOnly,
          allowEffectFields,
          context.sourceCode
        ) ?? method(node, localPrivateOnly, implementedMethods);

      if (candidate) {
        members.push(candidate);
      }
    }

    if (members.length === 0) {
      continue;
    }

    const unreadMembers = members.filter(
      (candidate) => !entry.reads.has(candidate.name)
    );

    if (unreadMembers.length === 0) {
      continue;
    }

    // ponytail: project analysis indexes the component's own template with
    // type information, so a template that cannot be read locally (for
    // example `templateUrl: URL`) defers to the index instead of failing.
    const reads = metadataReads(
      ngClass.metadata,
      ngClass.component && localTemplates,
      context.filename,
      unreadMembers.map((candidate) => candidate.name),
      !projectAnalysis
    );

    if (!reads) {
      continue;
    }

    for (const candidate of unreadMembers) {
      if (
        reads.has(candidate.name) ||
        projectMemberUsed?.(candidate.node) === true
      ) {
        continue;
      }

      context.report({
        data: { name: candidate.name },
        messageId: candidate.messageId,
        node: candidate.node.key
      });
    }
  }
};
