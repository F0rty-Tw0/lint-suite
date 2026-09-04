import {
  isBigIntLiteral,
  isIdentifier,
  isNumericLiteral,
  isPrivateIdentifier,
  isStringLiteralLike,
  SymbolFlags
} from 'typescript';
import type { PropertyName, Symbol, Type, TypeChecker } from 'typescript';

import type { ReadSink } from '../common/project-usage.type.js';
import { symbolsForName } from '../utils/type-property-symbols.util.js';

export const addSymbolDeclarations = (
  checker: TypeChecker,
  symbol: Symbol,
  sink: ReadSink
): void => {
  const resolved =
    (symbol.flags & SymbolFlags.Alias) === 0
      ? symbol
      : checker.getAliasedSymbol(symbol);

  for (const declaration of resolved.declarations ?? []) {
    sink.addDeclaration(declaration);
  }
};

export const allPropertySymbols = (
  checker: TypeChecker,
  type: Type
): Symbol[] => {
  const symbols = new Set(
    checker.getPropertiesOfType(checker.getApparentType(type))
  );

  if (type.isUnionOrIntersection()) {
    for (const member of type.types) {
      for (const symbol of allPropertySymbols(checker, member)) {
        symbols.add(symbol);
      }
    }
  }

  return [...symbols];
};

export const addNamedProperties = (
  checker: TypeChecker,
  type: Type,
  names: string[] | null,
  sink: ReadSink
): Symbol[] => {
  sink.addType(type);

  const symbols = names
    ? names.flatMap((name) => symbolsForName(checker, type, name))
    : allPropertySymbols(checker, type);

  for (const symbol of symbols) {
    addSymbolDeclarations(checker, symbol, sink);
  }

  return symbols;
};

export const literalPropertyNames = (type: Type): string[] | null => {
  if (type.isStringLiteral() || type.isNumberLiteral()) {
    return [String(type.value)];
  }

  if (!type.isUnion()) return null;

  const names: string[] = [];

  for (const member of type.types) {
    const memberNames = literalPropertyNames(member);

    if (!memberNames) return null;

    names.push(...memberNames);
  }

  return names;
};

export const propertyName = (
  checker: TypeChecker,
  node: PropertyName
): string[] | null => {
  const isLiteralName =
    isIdentifier(node) ||
    isPrivateIdentifier(node) ||
    isStringLiteralLike(node) ||
    isNumericLiteral(node) ||
    isBigIntLiteral(node);

  if (isLiteralName) return [node.text];

  return literalPropertyNames(checker.getTypeAtLocation(node.expression));
};
