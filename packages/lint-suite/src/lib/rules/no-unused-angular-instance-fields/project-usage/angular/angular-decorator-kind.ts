import {
  SymbolFlags,
  canHaveDecorators,
  getDecorators,
  isCallExpression,
  isImportDeclaration,
  isStringLiteralLike
} from 'typescript';
import type {
  ClassLikeDeclaration,
  Declaration,
  Expression,
  Node,
  Symbol
} from 'typescript';

import type { DecoratorKind, Discovery } from '../common/project-usage.type.ts';

const decoratorKinds: DecoratorKind[] = [
  'Component',
  'Directive',
  'NgModule',
  'Pipe'
];

const isDecoratorKind = (name: string): name is DecoratorKind => {
  return decoratorKinds.some((kind) => kind === name);
};

const isAngularCoreFile = (declaration: Declaration): boolean => {
  const fileName = declaration.getSourceFile().fileName.replaceAll('\\', '/');

  return fileName.includes('/node_modules/@angular/core/');
};

const parentOf = (node: Node): Node | undefined => {
  return node.parent;
};

const importedFromAngularCore = (declaration: Declaration): boolean => {
  let current = parentOf(declaration);

  while (current) {
    if (isImportDeclaration(current)) {
      return (
        isStringLiteralLike(current.moduleSpecifier) &&
        current.moduleSpecifier.text === '@angular/core'
      );
    }

    current = parentOf(current);
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

    if ((current.flags & SymbolFlags.Alias) === 0) return current;

    const next = discovery.checker.getImmediateAliasedSymbol(current);

    if (!next || next === current) return current;

    current = next;
  }

  return current;
};

export const angularDecoratorKind = (
  expression: Expression,
  discovery: Discovery
): DecoratorKind | null => {
  const unresolved = discovery.checker.getSymbolAtLocation(expression);

  if (!unresolved) return null;

  const symbol = resolveAlias(unresolved, discovery);
  const name = symbol.getName();

  if (!isDecoratorKind(name)) return null;

  const unresolvedDeclarations = unresolved.declarations ?? [];
  const symbolDeclarations = symbol.declarations ?? [];
  const isCoreImport = unresolvedDeclarations.some(importedFromAngularCore);
  const isCoreDeclaration = symbolDeclarations.some(isAngularCoreFile);
  const fromAngularCore = isCoreImport || isCoreDeclaration;

  if (!fromAngularCore) return null;

  return name;
};

export const classDecoratorKind = (
  declaration: ClassLikeDeclaration,
  discovery: Discovery
): DecoratorKind | null => {
  const hasDecorators = canHaveDecorators(declaration);

  if (!hasDecorators) return null;

  for (const decorator of getDecorators(declaration) ?? []) {
    const isDecoratorCall = isCallExpression(decorator.expression);

    if (!isDecoratorCall) continue;

    const kind = angularDecoratorKind(
      decorator.expression.expression,
      discovery
    );

    if (kind !== null) return kind;
  }

  return null;
};
