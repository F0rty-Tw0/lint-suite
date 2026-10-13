import {
  SyntaxKind,
  isArrayLiteralExpression,
  isClassLike,
  isIdentifier,
  isPropertyAccessExpression
} from 'typescript';
import type {
  ClassLikeDeclaration,
  Expression,
  ObjectLiteralExpression,
  Symbol
} from 'typescript';

import { classDecoratorKind, resolveAlias } from './angular-decorator-kind.ts';
import { metadataProperty } from './angular-metadata-values.ts';
import type { Discovery } from '../common/project-usage.type.ts';

const booleanValue = (node: Expression | undefined): boolean | undefined => {
  if (!node) return undefined;

  if (node.kind === SyntaxKind.TrueKeyword) return true;

  if (node.kind === SyntaxKind.FalseKeyword) return false;

  return undefined;
};

const classesOf = (
  symbol: Symbol,
  discovery: Discovery
): ClassLikeDeclaration[] => {
  const resolved = resolveAlias(symbol, discovery);
  const declarations = resolved.declarations ?? [];

  return declarations.filter(isClassLike);
};

const scopedClasses = (
  classes: ClassLikeDeclaration[],
  discovery: Discovery
): ClassLikeDeclaration[] | null => {
  const scoped: ClassLikeDeclaration[] = [];

  for (const declaration of classes) {
    if (declaration.getSourceFile().isDeclarationFile) continue;

    const kind = classDecoratorKind(declaration, discovery);

    if (kind === 'Pipe') continue;

    if (kind !== 'Component' && kind !== 'Directive') return null;

    scoped.push(declaration);
  }

  return scoped;
};

const importedClasses = (
  element: Expression,
  discovery: Discovery
): ClassLikeDeclaration[] | null => {
  const isIdentifierElement = isIdentifier(element);
  const isPropertyAccessElement = isPropertyAccessExpression(element);

  if (!isIdentifierElement && !isPropertyAccessElement) return null;

  const target = isIdentifierElement ? element : element.name;
  const symbol = discovery.checker.getSymbolAtLocation(target);

  if (!symbol) return null;

  const classes = classesOf(symbol, discovery);

  if (classes.length === 0) return null;

  return scopedClasses(classes, discovery);
};

/**
 * Resolves a standalone component's `imports` to program classes. Library
 * classes and pipes are skipped; anything that cannot be classified (an
 * NgModule, a spread, a `forwardRef`) makes the scope unknown.
 */
export const scopeOf = (
  metadata: ObjectLiteralExpression,
  discovery: Discovery
): ClassLikeDeclaration[] | null => {
  const standalone = booleanValue(metadataProperty(metadata, 'standalone'));
  const imports = metadataProperty(metadata, 'imports');
  const isModuleDeclared = standalone === undefined && !imports;

  if (standalone === false || isModuleDeclared) return null;

  if (!imports) return [];

  const isImportsArray = isArrayLiteralExpression(imports);

  if (!isImportsArray) return null;

  const scope: ClassLikeDeclaration[] = [];

  for (const element of imports.elements) {
    const classes = importedClasses(element, discovery);

    if (classes === null) return null;

    scope.push(...classes);
  }

  return scope;
};
