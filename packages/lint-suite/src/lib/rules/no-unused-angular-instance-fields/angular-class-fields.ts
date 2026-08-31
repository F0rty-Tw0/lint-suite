import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { metadataReads } from './angular-metadata-reads.js';
import type {
  AngularClassNode,
  AngularImport,
  AngularImports,
  ClassEntry,
  DynamicClasses,
  RuleOptions
} from './common/no-unused-angular-instance-fields.type.js';

const managedApis: Readonly<Record<string, true>> = {
  input: true,
  model: true,
  output: true
};

type InstanceField = TSESTree.PropertyDefinition & {
  readonly key: TSESTree.Identifier;
};
type InstanceMethod = TSESTree.MethodDefinition & {
  readonly key: TSESTree.Identifier;
};
type RuleContext = Readonly<
  TSESLint.RuleContext<'unusedField' | 'unusedMethod', RuleOptions>
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

const isInstanceMethod = (
  node: TSESTree.ClassElement
): node is InstanceMethod =>
  node.type === TSESTree.AST_NODE_TYPES.MethodDefinition &&
  node.key.type === TSESTree.AST_NODE_TYPES.Identifier;

const isExcludedField = (
  node: InstanceField,
  component: boolean,
  projectAnalysis: boolean
): boolean =>
  node.static ||
  node.declare ||
  node.override ||
  node.decorators.length > 0 ||
  (!component && !projectAnalysis && node.accessibility !== 'private');

const hasManualCleanup = (node: TSESTree.CallExpression): boolean => {
  const options = node.arguments[1];

  if (options?.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  return options.properties.some((property) => {
    if (property.type !== TSESTree.AST_NODE_TYPES.Property) {
      return false;
    }

    const name =
      property.key.type === TSESTree.AST_NODE_TYPES.Identifier &&
      !property.computed
        ? property.key.name
        : property.key.type === TSESTree.AST_NODE_TYPES.Literal &&
            typeof property.key.value === 'string'
          ? property.key.value
          : undefined;

    return (
      name === 'manualCleanup' &&
      property.value.type === TSESTree.AST_NODE_TYPES.Literal &&
      property.value.value === true
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

  if (typeof name !== 'string') {
    return false;
  }

  if (managedApis[name] === true) {
    return true;
  }

  return (
    allowEffectFields &&
    name === 'effect' &&
    isImportBinding(node.value.callee, sourceCode) &&
    !hasManualCleanup(node.value)
  );
};

const field = (
  node: TSESTree.ClassElement,
  imports: AngularImports,
  component: boolean,
  allowEffectFields: boolean,
  sourceCode: TSESLint.SourceCode,
  projectAnalysis: boolean
): MemberCandidate | null => {
  if (
    isInstanceField(node) &&
    !isExcludedField(node, component, projectAnalysis) &&
    !isManagedField(node, imports, allowEffectFields, sourceCode)
  ) {
    return { messageId: 'unusedField', name: node.key.name, node };
  }

  return null;
};

const isExcludedMethod = (
  node: InstanceMethod,
  component: boolean,
  projectAnalysis: boolean
): boolean =>
  node.static ||
  node.override ||
  node.decorators.length > 0 ||
  node.computed ||
  node.kind !== 'method' ||
  node.value.body === null ||
  lifecycleHooks[node.key.name] === true ||
  (!component && !projectAnalysis && node.accessibility !== 'private');

const method = (
  node: TSESTree.ClassElement,
  component: boolean,
  projectAnalysis: boolean
): MemberCandidate | null => {
  if (
    isInstanceMethod(node) &&
    !isExcludedMethod(node, component, projectAnalysis)
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
  projectMemberUsed: ((node: TSESTree.ClassElement) => boolean) | undefined
): void => {
  for (const entry of classes) {
    const ngClass = angularClass(entry.node, imports);

    if (!ngClass || dynamicClasses.has(entry)) {
      continue;
    }

    const members: MemberCandidate[] = [];

    for (const node of entry.node.body.body) {
      const candidate =
        field(
          node,
          imports,
          ngClass.component,
          allowEffectFields,
          context.sourceCode,
          projectMemberUsed !== undefined
        ) ?? method(node, ngClass.component, projectMemberUsed !== undefined);
      if (candidate) {
        members.push(candidate);
      }
    }

    if (members.length === 0) {
      continue;
    }

    const unreadMembers = members.filter(
      (candidate) =>
        !entry.reads.has(candidate.name) && !projectMemberUsed?.(candidate.node)
    );

    if (unreadMembers.length === 0) {
      continue;
    }

    const reads = metadataReads(
      ngClass.metadata,
      ngClass.component,
      context.filename,
      unreadMembers.map((candidate) => candidate.name)
    );

    if (!reads) {
      continue;
    }

    for (const candidate of unreadMembers) {
      if (!reads.has(candidate.name)) {
        context.report({
          data: { name: candidate.name },
          messageId: candidate.messageId,
          node: candidate.node.key
        });
      }
    }
  }
};
