import { ObjectFlags, TypeFlags } from 'typescript';
import type {
  InterfaceType,
  ObjectType,
  SourceFile,
  Type,
  TypeChecker,
  TypeReference
} from 'typescript';

const isObjectType = (type: Type): type is ObjectType => {
  return (type.flags & TypeFlags.Object) !== 0;
};

const isTypeReference = (type: ObjectType): type is TypeReference => {
  return (type.objectFlags & ObjectFlags.Reference) !== 0;
};

const isInterfaceType = (type: ObjectType): type is InterfaceType => {
  return (type.objectFlags & ObjectFlags.ClassOrInterface) !== 0;
};

export const addTypeDependencies = (
  checker: TypeChecker,
  type: Type,
  dependencies: Set<SourceFile>,
  seen: Set<Type>
): void => {
  const isSeen = seen.has(type);

  if (isSeen) return;

  seen.add(type);

  const isUnionOrIntersection = type.isUnionOrIntersection();

  if (isUnionOrIntersection) {
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

  const isObject = isObjectType(type);

  if (!isObject) return;

  const isReference = isTypeReference(type);
  const target = isReference ? type.target : type;
  const isClassOrInterface = isInterfaceType(target);

  if (!isClassOrInterface) return;

  for (const base of checker.getBaseTypes(target)) {
    addTypeDependencies(checker, base, dependencies, seen);
  }
};
