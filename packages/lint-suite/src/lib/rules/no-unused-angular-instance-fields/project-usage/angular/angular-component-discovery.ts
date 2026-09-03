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
  if (!canHaveDecorators(declaration)) {
    return null;
  }

  const name = declaration.name?.text ?? '';

  for (const decorator of getDecorators(declaration) ?? []) {
    if (!isCallExpression(decorator.expression)) {
      continue;
    }

    const kind = angularDecoratorKind(
      decorator.expression.expression,
      discovery
    );

    if (kind !== 'Component' && kind !== 'Directive') {
      continue;
    }

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

    if (metadata === undefined && !component) {
      return { ...base, valid: true };
    }

    if (metadata === undefined || !isObjectLiteralExpression(metadata)) {
      return { ...base, valid: false };
    }

    const template = component
      ? templateOf(metadata, declaration.getSourceFile().fileName, discovery)
      : null;

    return {
      ...base,
      exportAs: exportAsOf(metadata, discovery),
      hostDirectives:
        metadataProperty(metadata, 'hostDirectives') !== undefined,
      scope: component ? scopeOf(metadata, discovery) : null,
      selector: stringValue(metadataProperty(metadata, 'selector'), discovery),
      template: template ?? null,
      valid: template !== undefined
    };
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
    if (isClassLike(node)) {
      const found = angularClass(node, discovery);

      if (found) {
        classes.push(found);
      }
    }

    forEachChild(node, visit);
  };

  visit(sourceFile);
  discovery.dependencies.delete(sourceFile);

  return { classes, dependencies: discovery.dependencies };
};
