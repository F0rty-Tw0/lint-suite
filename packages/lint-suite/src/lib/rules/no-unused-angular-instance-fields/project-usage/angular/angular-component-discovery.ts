import { dirname, resolve } from 'node:path';

import {
  canHaveDecorators,
  forEachChild,
  getDecorators,
  isArrayLiteralExpression,
  isCallExpression,
  isClassLike,
  isIdentifier,
  isImportDeclaration,
  isNumericLiteral,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteralLike,
  SymbolFlags,
  SyntaxKind
} from 'typescript';
import type {
  ClassLikeDeclaration,
  Declaration,
  Expression,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  Symbol,
  TypeChecker
} from 'typescript';

export type AngularTemplate =
  | { readonly kind: 'external'; readonly fileName: string }
  | { readonly kind: 'inline'; readonly source: string };

export type AngularClass = {
  readonly component: boolean;
  readonly declaration: ClassLikeDeclaration;
  readonly exportAs: readonly string[];
  /** True when `hostDirectives` is set; their exportAs is not modelled. */
  readonly hostDirectives: boolean;
  readonly name: string;
  /**
   * Program classes a standalone component's `imports` resolve to, or null
   * when the compilation scope cannot be determined statically.
   */
  readonly scope: readonly ClassLikeDeclaration[] | null;
  readonly selector: string | null;
  readonly template: AngularTemplate | null;
  /** False when the metadata cannot be read statically (fail closed). */
  readonly valid: boolean;
};

type DecoratorKind = 'Component' | 'Directive' | 'NgModule' | 'Pipe';

type Discovery = {
  readonly checker: TypeChecker;
  /** Files whose contents the discovered metadata depends on. */
  readonly dependencies: Set<SourceFile>;
};

const decoratorKinds: ReadonlySet<string> = new Set<DecoratorKind>([
  'Component',
  'Directive',
  'NgModule',
  'Pipe'
]);

const importedFromAngularCore = (declaration: Declaration): boolean => {
  let current: Node = declaration;

  while (current.parent) {
    current = current.parent;

    if (isImportDeclaration(current)) {
      return (
        isStringLiteralLike(current.moduleSpecifier) &&
        current.moduleSpecifier.text === '@angular/core'
      );
    }
  }

  return false;
};

/**
 * Follows an alias one hop at a time so every re-exporting file on the way
 * to the target becomes a dependency of the discovery result.
 */
const resolveAlias = (symbol: Symbol, discovery: Discovery): Symbol => {
  let current = symbol;

  for (let hop = 0; hop < 32; hop += 1) {
    for (const declaration of current.declarations ?? []) {
      discovery.dependencies.add(declaration.getSourceFile());
    }

    if ((current.flags & SymbolFlags.Alias) === 0) {
      return current;
    }

    const next = discovery.checker.getImmediateAliasedSymbol(current);

    if (!next || next === current) {
      return current;
    }

    current = next;
  }

  return current;
};

const angularDecoratorKind = (
  expression: Expression,
  discovery: Discovery
): DecoratorKind | null => {
  const unresolved = discovery.checker.getSymbolAtLocation(expression);

  if (!unresolved) {
    return null;
  }

  const symbol = resolveAlias(unresolved, discovery);
  const name = symbol.getName();

  if (!decoratorKinds.has(name)) {
    return null;
  }

  const fromAngularCore =
    (unresolved.declarations ?? []).some(importedFromAngularCore) ||
    (symbol.declarations ?? []).some((declaration) =>
      declaration
        .getSourceFile()
        .fileName.replaceAll('\\', '/')
        .includes('/node_modules/@angular/core/')
    );

  return fromAngularCore ? (name as DecoratorKind) : null;
};

const classDecoratorKind = (
  declaration: ClassLikeDeclaration,
  discovery: Discovery
): DecoratorKind | null => {
  if (!canHaveDecorators(declaration)) {
    return null;
  }

  for (const decorator of getDecorators(declaration) ?? []) {
    if (!isCallExpression(decorator.expression)) {
      continue;
    }

    const kind = angularDecoratorKind(
      decorator.expression.expression,
      discovery
    );

    if (kind !== null) {
      return kind;
    }
  }

  return null;
};

/**
 * The string an expression evaluates to: a literal, or a constant whose
 * type is a single string literal (`const URL = './x.html'`, imported or
 * not). The constant's declaration file becomes a dependency.
 */
const stringValue = (
  node: Expression | undefined,
  discovery: Discovery
): string | null => {
  if (!node) {
    return null;
  }

  if (isStringLiteralLike(node)) {
    return node.text;
  }

  if (isIdentifier(node) || isPropertyAccessExpression(node)) {
    const symbol = discovery.checker.getSymbolAtLocation(
      isIdentifier(node) ? node : node.name
    );

    if (symbol) {
      resolveAlias(symbol, discovery);
    }
  }

  const type = discovery.checker.getTypeAtLocation(node);

  return type.isStringLiteral() ? type.value : null;
};

const metadataProperty = (
  metadata: ObjectLiteralExpression,
  name: string
): Expression | undefined => {
  for (const property of metadata.properties) {
    if (
      isPropertyAssignment(property) &&
      (isIdentifier(property.name) ||
        isStringLiteralLike(property.name) ||
        isNumericLiteral(property.name)) &&
      property.name.text === name
    ) {
      return property.initializer;
    }
  }

  return undefined;
};

const templateOf = (
  metadata: ObjectLiteralExpression,
  fileName: string,
  discovery: Discovery
): AngularTemplate | null | undefined => {
  const inline = metadataProperty(metadata, 'template');

  if (inline) {
    const source = stringValue(inline, discovery);

    return source === null ? undefined : { kind: 'inline', source };
  }

  const url = metadataProperty(metadata, 'templateUrl');

  if (url) {
    const text = stringValue(url, discovery);

    return text === null
      ? undefined
      : { kind: 'external', fileName: resolve(dirname(fileName), text) };
  }

  return null;
};

const exportAsOf = (
  metadata: ObjectLiteralExpression,
  discovery: Discovery
): readonly string[] =>
  (stringValue(metadataProperty(metadata, 'exportAs'), discovery) ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

const booleanValue = (node: Expression | undefined): boolean | undefined => {
  if (!node) {
    return undefined;
  }

  if (node.kind === SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === SyntaxKind.FalseKeyword) {
    return false;
  }

  return undefined;
};

const classesOf = (
  symbol: Symbol,
  discovery: Discovery
): ClassLikeDeclaration[] =>
  (resolveAlias(symbol, discovery).declarations ?? []).filter(isClassLike);

/**
 * Resolves a standalone component's `imports` to program classes. Library
 * classes and pipes are skipped; anything that cannot be classified (an
 * NgModule, a spread, a `forwardRef`) makes the scope unknown.
 */
const scopeOf = (
  metadata: ObjectLiteralExpression,
  discovery: Discovery
): readonly ClassLikeDeclaration[] | null => {
  const standalone = booleanValue(metadataProperty(metadata, 'standalone'));
  const imports = metadataProperty(metadata, 'imports');

  if (standalone === false || (standalone === undefined && !imports)) {
    return null;
  }

  if (!imports) {
    return [];
  }

  if (!isArrayLiteralExpression(imports)) {
    return null;
  }

  const scope: ClassLikeDeclaration[] = [];

  for (const element of imports.elements) {
    if (!isIdentifier(element) && !isPropertyAccessExpression(element)) {
      return null;
    }

    const symbol = discovery.checker.getSymbolAtLocation(
      isIdentifier(element) ? element : element.name
    );
    const classes = symbol ? classesOf(symbol, discovery) : [];

    if (classes.length === 0) {
      return null;
    }

    for (const declaration of classes) {
      if (declaration.getSourceFile().isDeclarationFile) {
        continue;
      }

      const kind = classDecoratorKind(declaration, discovery);

      if (kind === 'Pipe') {
        continue;
      }

      if (kind !== 'Component' && kind !== 'Directive') {
        return null;
      }

      scope.push(declaration);
    }
  }

  return scope;
};

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

export type DiscoveredClasses = {
  readonly classes: readonly AngularClass[];
  readonly dependencies: ReadonlySet<SourceFile>;
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
