import { IndexKind } from 'typescript';
import type { Symbol, Type, TypeChecker } from 'typescript';

export const symbolsForName = (
  checker: TypeChecker,
  type: Type,
  name: string
): Symbol[] => {
  const symbol = checker.getPropertyOfType(checker.getApparentType(type), name);

  if (symbol) return [symbol];

  if (!type.isUnionOrIntersection()) return [];

  const symbols = new Set<Symbol>();

  for (const member of type.types) {
    for (const memberSymbol of symbolsForName(checker, member, name)) {
      symbols.add(memberSymbol);
    }
  }

  return [...symbols];
};

export const stringIndexTypes = (checker: TypeChecker, type: Type): Type[] => {
  const indexedType = checker.getIndexTypeOfType(
    checker.getApparentType(type),
    IndexKind.String
  );

  if (indexedType) return [indexedType];

  if (!type.isUnionOrIntersection()) return [];

  const indexedTypes = new Set<Type>();

  for (const member of type.types) {
    for (const memberIndexedType of stringIndexTypes(checker, member)) {
      indexedTypes.add(memberIndexedType);
    }
  }

  return [...indexedTypes];
};
