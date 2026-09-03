import {
  canHaveDecorators,
  getDecorators,
  isCallExpression,
  isImportDeclaration,
  isStringLiteralLike,
  SymbolFlags
} from 'typescript';
import type {
  ClassLikeDeclaration,
  Declaration,
  Expression,
  Node,
  Symbol
} from 'typescript';

import type { DecoratorKind, Discovery } from '../common/project-usage.type.js';

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
export const resolveAlias = (symbol: Symbol, discovery: Discovery): Symbol => {
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

export const angularDecoratorKind = (
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

export const classDecoratorKind = (
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
