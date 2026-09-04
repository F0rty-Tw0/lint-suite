import { ObjectFlags, TypeFlags } from 'typescript';
import type {
  InterfaceType,
  ObjectType,
  SourceFile,
  Type,
  TypeChecker,
  TypeReference
} from 'typescript';

export const addTypeDependencies = (
  checker: TypeChecker,
  type: Type,
  dependencies: Set<SourceFile>,
  seen: Set<Type>
): void => {
  if (seen.has(type)) return;

  seen.add(type);

  if (type.isUnionOrIntersection()) {
    for (const member of type.types) {
      addTypeDependencies(checker, member, dependencies, seen);
    }

    return;
  }

  for (const symbol of [type.getSymbol(), type.aliasSymbol]) {
    for (const declaration of symbol?.declarations ?? []) {
      dependencies.add(declaration.getSourceFile());
    }
  }

  if ((type.flags & TypeFlags.TypeParameter) !== 0) {
    const constraint = checker.getBaseConstraintOfType(type);

    if (constraint) {
      addTypeDependencies(checker, constraint, dependencies, seen);
    }

    return;
  }

  if ((type.flags & TypeFlags.Object) === 0) return;

  const objectType = type as ObjectType;
  const target =
    (objectType.objectFlags & ObjectFlags.Reference) !== 0
      ? (type as TypeReference).target
      : objectType;

  if ((target.objectFlags & ObjectFlags.ClassOrInterface) !== 0) {
    for (const base of checker.getBaseTypes(target as InterfaceType)) {
      addTypeDependencies(checker, base, dependencies, seen);
    }
  }
};
