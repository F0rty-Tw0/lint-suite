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

const addDeclarationFiles = (
  type: Type,
  dependencies: Set<SourceFile>
): void => {
  for (const symbol of [type.getSymbol(), type.aliasSymbol]) {
    const declarations = symbol?.declarations ?? [];

    for (const declaration of declarations) {
      dependencies.add(declaration.getSourceFile());
    }
  }
};

const baseTypesOf = (checker: TypeChecker, type: Type): Type[] => {
  const isObject = isObjectType(type);

  if (!isObject) return [];

  const isReference = isTypeReference(type);
  const target = isReference ? type.target : type;
  const isClassOrInterface = isInterfaceType(target);

  if (!isClassOrInterface) return [];

  return checker.getBaseTypes(target);
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

  addDeclarationFiles(type, dependencies);

  const isTypeParameter = (type.flags & TypeFlags.TypeParameter) !== 0;

  if (isTypeParameter) {
    const constraint = checker.getBaseConstraintOfType(type);

    if (constraint) {
      addTypeDependencies(checker, constraint, dependencies, seen);
    }

    return;
  }

  for (const base of baseTypesOf(checker, type)) {
    addTypeDependencies(checker, base, dependencies, seen);
  }
};
