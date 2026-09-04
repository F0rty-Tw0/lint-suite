import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isCallExpression,
  isClassLike,
  isObjectLiteralExpression
} from 'typescript';
import type {
  ClassLikeDeclaration,
  Node,
  SourceFile,
  TypeChecker
} from 'typescript';

import type {
  AngularClass,
  DiscoveredClasses,
  Discovery
} from '../common/project-usage.type.js';
import { scopeOf } from './angular-component-scope.js';
import { angularDecoratorKind } from './angular-decorator-kind.js';
import {
  exportAsOf,
  metadataProperty,
  stringValue,
  templateOf
} from './angular-metadata-values.js';

const angularClass = (
  declaration: ClassLikeDeclaration,
  discovery: Discovery
): AngularClass | null => {
  const hasDecorators = canHaveDecorators(declaration);

  if (!hasDecorators) return null;

  const name = declaration.name?.text ?? '';

  for (const decorator of getDecorators(declaration) ?? []) {
    const isDecoratorCall = isCallExpression(decorator.expression);

    if (!isDecoratorCall) continue;

    const kind = angularDecoratorKind(
      decorator.expression.expression,
      discovery
    );

    if (kind !== 'Component' && kind !== 'Directive') continue;

    const component = kind === 'Component';
    const metadata = decorator.expression.arguments[0];
    const base = {
      component,
      declaration,
      exportAs: [],
      hostDirectives: false,
      name,
      scope: null,
      selector: null,
      template: null
    };

    if (metadata === undefined) {
      const bareDiscovery: AngularClass | null = { ...base, valid: !component };

      return bareDiscovery;
    }

    const isMetadataObject = isObjectLiteralExpression(metadata);

    if (!isMetadataObject) {
      const invalidDiscovery: AngularClass | null = { ...base, valid: false };

      return invalidDiscovery;
    }

    const described = {
      ...base,
      exportAs: exportAsOf(metadata, discovery),
      hostDirectives:
        metadataProperty(metadata, 'hostDirectives') !== undefined,
      selector: stringValue(metadataProperty(metadata, 'selector'), discovery)
    };

    if (!component) {
      const directiveDiscovery: AngularClass | null = {
        ...described,
        valid: true
      };

      return directiveDiscovery;
    }

    const fileName = declaration.getSourceFile().fileName;
    const template = templateOf(metadata, fileName, discovery);
    const componentDiscovery: AngularClass | null = {
      ...described,
      scope: scopeOf(metadata, discovery),
      template: template ?? null,
      valid: template !== undefined
    };

    return componentDiscovery;
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
