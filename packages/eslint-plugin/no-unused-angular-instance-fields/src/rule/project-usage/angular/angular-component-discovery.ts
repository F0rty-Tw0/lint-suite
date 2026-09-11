import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isCallExpression,
  isClassLike,
  isObjectLiteralExpression
} from 'typescript';
import type {
  CallExpression,
  ClassLikeDeclaration,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  TypeChecker
} from 'typescript';

import { scopeOf } from './angular-component-scope.ts';
import { angularDecoratorKind } from './angular-decorator-kind.ts';
import {
  exportAsOf,
  metadataProperty,
  stringValue,
  templateOf
} from './angular-metadata-values.ts';
import type {
  AngularClass,
  DiscoveredClasses,
  Discovery
} from '../common/project-usage.type.ts';

type UndecidedClass = Omit<AngularClass, 'valid'>;

const describedClass = (
  base: UndecidedClass,
  metadata: ObjectLiteralExpression,
  discovery: Discovery
): AngularClass => {
  const selector = metadataProperty(metadata, 'selector');
  const described = {
    ...base,
    exportAs: exportAsOf(metadata, discovery),
    hostDirectives: metadataProperty(metadata, 'hostDirectives') !== undefined,
    selector: stringValue(selector, discovery)
  };

  if (!base.component) {
    const directiveDiscovery: AngularClass = { ...described, valid: true };

    return directiveDiscovery;
  }

  const fileName = base.declaration.getSourceFile().fileName;
  const template = templateOf(metadata, fileName, discovery);
  const componentDiscovery: AngularClass = {
    ...described,
    scope: scopeOf(metadata, discovery),
    template: template ?? null,
    valid: template !== undefined
  };

  return componentDiscovery;
};

const decoratedClass = (
  declaration: ClassLikeDeclaration,
  call: CallExpression,
  discovery: Discovery
): AngularClass | null => {
  const kind = angularDecoratorKind(call.expression, discovery);

  if (kind !== 'Component' && kind !== 'Directive') return null;

  const component = kind === 'Component';
  const base: UndecidedClass = {
    component,
    declaration,
    exportAs: [],
    hostDirectives: false,
    name: declaration.name?.text ?? '',
    scope: null,
    selector: null,
    template: null
  };
  const metadata = call.arguments.at(0);

  if (metadata === undefined) {
    const bareDiscovery: AngularClass = { ...base, valid: !component };

    return bareDiscovery;
  }

  const isMetadataObject = isObjectLiteralExpression(metadata);

  if (!isMetadataObject) {
    const invalidDiscovery: AngularClass = { ...base, valid: false };

    return invalidDiscovery;
  }

  return describedClass(base, metadata, discovery);
};

const angularClass = (
  declaration: ClassLikeDeclaration,
  discovery: Discovery
): AngularClass | null => {
  const hasDecorators = canHaveDecorators(declaration);

  if (!hasDecorators) return null;

  for (const decorator of getDecorators(declaration) ?? []) {
    const isDecoratorCall = isCallExpression(decorator.expression);

    if (!isDecoratorCall) continue;

    const found = decoratedClass(declaration, decorator.expression, discovery);

    if (found) return found;
  }

  return null;
};

/** Angular components and directives declared in one source file. */
export const angularClasses = (
  sourceFile: SourceFile,
  checker: TypeChecker
): DiscoveredClasses => {
  const classes: AngularClass[] = [];
  const discovery: Discovery = { checker, dependencies: new Set() };

  const visit = (node: Node): void => {
    const isClass = isClassLike(node);

    if (isClass) {
      const found = angularClass(node, discovery);

      if (found) {
        classes.push(found);
      }
    }

    forEachChild(node, visit);
  };

  visit(sourceFile);
  discovery.dependencies.delete(sourceFile);

  const discovered: DiscoveredClasses = {
    classes,
    dependencies: discovery.dependencies
  };

  return discovered;
};
