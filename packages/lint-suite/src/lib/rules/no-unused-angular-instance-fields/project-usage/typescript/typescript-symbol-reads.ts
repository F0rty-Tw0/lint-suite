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
  const isUnionOrIntersection = type.isUnionOrIntersection();

  if (isUnionOrIntersection) {
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
  const isStringLiteral = type.isStringLiteral();
  const isNumberLiteral = type.isNumberLiteral();
  const isLiteralType = isStringLiteral || isNumberLiteral;

  if (isLiteralType) return [String(type.value)];

  const isUnion = type.isUnion();

  if (!isUnion) return null;

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
  const isIdentifierName = isIdentifier(node);
  const isPrivateName = isPrivateIdentifier(node);
  const isStringName = isStringLiteralLike(node);
  const isNumericName = isNumericLiteral(node);
  const isBigIntName = isBigIntLiteral(node);
  const isLiteralName =
    isIdentifierName ||
    isPrivateName ||
    isStringName ||
    isNumericName ||
    isBigIntName;

  if (isLiteralName) return [node.text];

  return literalPropertyNames(checker.getTypeAtLocation(node.expression));
};
