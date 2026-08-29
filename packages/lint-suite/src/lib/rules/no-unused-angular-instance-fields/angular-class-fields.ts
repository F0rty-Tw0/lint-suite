import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import { metadataReads } from './angular-metadata-reads.js';
import type {
  AngularClassNode,
  AngularImport,
  AngularImports,
  ClassEntry,
  DynamicClasses
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
  TSESLint.RuleContext<'unusedField' | 'unusedMethod', []>
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

const isExcludedField = (node: InstanceField, component: boolean): boolean =>
  node.static ||
  node.declare ||
  node.override ||
  node.decorators.length > 0 ||
  (!component && node.accessibility !== 'private');

const isManagedField = (
  node: InstanceField,
  imports: AngularImports
): boolean => {
  if (node.value?.type !== TSESTree.AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const name = angularName(node.value.callee, imports);

  return typeof name === 'string' && managedApis[name] === true;
};

const field = (
  node: TSESTree.ClassElement,
  imports: AngularImports,
  component: boolean
): MemberCandidate | null => {
  if (
    isInstanceField(node) &&
    !isExcludedField(node, component) &&
    !isManagedField(node, imports)
  ) {
    return { messageId: 'unusedField', name: node.key.name, node };
  }

  return null;
};

const isExcludedMethod = (
  node: InstanceMethod,
  component: boolean
): boolean =>
  node.static ||
  node.override ||
  node.decorators.length > 0 ||
  node.computed ||
  node.kind !== 'method' ||
  node.value.body === null ||
  lifecycleHooks[node.key.name] === true ||
  (!component && node.accessibility !== 'private');

const method = (
  node: TSESTree.ClassElement,
  component: boolean
): MemberCandidate | null => {
  if (isInstanceMethod(node) && !isExcludedMethod(node, component)) {
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
  dynamicClasses: DynamicClasses
): void => {
  for (const entry of classes) {
    const ngClass = angularClass(entry.node, imports);

    if (!ngClass || dynamicClasses.has(entry)) {
      continue;
    }

    const members: MemberCandidate[] = [];

    for (const node of entry.node.body.body) {
      const candidate =
        field(node, imports, ngClass.component) ?? method(node, ngClass.component);

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
