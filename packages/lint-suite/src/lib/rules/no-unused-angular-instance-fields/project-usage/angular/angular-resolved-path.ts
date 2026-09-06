import { SignatureKind, TypeFlags } from 'typescript';
import type {
  ClassLikeDeclaration,
  Symbol,
  Type,
  TypeChecker
} from 'typescript';

import type {
  ReadSegment,
  ReadSink,
  ResolvedPathOptions
} from '../common/project-usage.type.ts';
import { ownMembersNamed } from '../utils/class-members.util.ts';
import {
  stringIndexTypes,
  symbolsForName
} from '../utils/type-property-symbols.util.ts';

const hasAnyOrUnknownFlag = (type: { flags: TypeFlags }): boolean => {
  const anyOrUnknown = TypeFlags.Any | TypeFlags.Unknown;

  return (type.flags & anyOrUnknown) !== 0;
};

const isAnyOrUnknown = (types: { flags: TypeFlags }[]): boolean => {
  return types.some(hasAnyOrUnknownFlag);
};

const addTypes = (sink: ReadSink, types: Type[]): void => {
  for (const type of types) {
    sink.addType(type);
  }
};

const callReturnTypes = (checker: TypeChecker, type: Type): Type[] => {
  const signatures = checker.getSignaturesOfType(type, SignatureKind.Call);

  return signatures.map((signature) => signature.getReturnType());
};

const memberTypes = (
  symbols: Set<Symbol>,
  declaration: ClassLikeDeclaration,
  checker: TypeChecker,
  sink: ReadSink
): Type[] => {
  const types: Type[] = [];

  for (const symbol of symbols) {
    for (const memberDeclaration of symbol.declarations ?? []) {
      sink.addDeclaration(memberDeclaration);
    }

    types.push(checker.getTypeOfSymbolAtLocation(symbol, declaration));
  }

  return types;
};

/** A lone `name` the class declares itself needs no checker: true when handled. */
const addOwnMemberPath = (
  declaration: ClassLikeDeclaration,
  names: ReadSegment[],
  sink: ReadSink
): boolean => {
  const [only] = names;
  const isSingle = names.length === 1 && only !== undefined;

  if (!isSingle) return false;

  const members = ownMembersNamed(declaration, only.name);

  if (members.length === 0) return false;

  for (const member of members) sink.addDeclaration(member);

  return true;
};

export const addResolvedPath = ({
  allowMissingRoot,
  checker,
  declaration,
  names,
  sink
}: ResolvedPathOptions): boolean => {
  const isOwnMember = addOwnMemberPath(declaration, names, sink);

  if (isOwnMember) return true;

  let types = [checker.getTypeAtLocation(declaration)];
  const indexTypesOf = (type: Type): Type[] => stringIndexTypes(checker, type);
  const returnTypesOf = (type: Type): Type[] => callReturnTypes(checker, type);

  for (const [index, segment] of names.entries()) {
    addTypes(sink, types);

    const symbolsOf = (type: Type): Symbol[] => {
      return symbolsForName(checker, type, segment.name);
    };
    const symbols = new Set(types.flatMap(symbolsOf));

    if (symbols.size === 0) {
      const indexedTypes = types.flatMap(indexTypesOf);

      if (indexedTypes.length > 0) {
        types = indexedTypes;
        continue;
      }

      const isAnyOrUnknownType = isAnyOrUnknown(types);

      if (isAnyOrUnknownType) return true;

      return index === 0 && allowMissingRoot;
    }

    types = memberTypes(symbols, declaration, checker, sink);

    if (segment.called) {
      const returnTypes = types.flatMap(returnTypesOf);

      if (returnTypes.length === 0) return isAnyOrUnknown(types);

      types = returnTypes;
    }
  }

  return true;
};
