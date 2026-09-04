import { SignatureKind, TypeFlags } from 'typescript';
import type {
  ClassLikeDeclaration,
  Symbol,
  Type,
  TypeChecker
} from 'typescript';

import type {
  ReadSink,
  ResolvedPathOptions
} from '../common/project-usage.type.ts';
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

export const addResolvedPath = ({
  allowMissingRoot,
  checker,
  declaration,
  names,
  sink
}: ResolvedPathOptions): boolean => {
  let types = [checker.getTypeAtLocation(declaration)];

  for (const [index, segment] of names.entries()) {
    addTypes(sink, types);

    const symbols = new Set(
      types.flatMap((type) => symbolsForName(checker, type, segment.name))
    );

    if (symbols.size === 0) {
      const indexedTypes = types.flatMap((type) =>
        stringIndexTypes(checker, type)
      );

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
      const returnTypes = types.flatMap((type) =>
        callReturnTypes(checker, type)
      );

      if (returnTypes.length === 0) return isAnyOrUnknown(types);

      types = returnTypes;
    }
  }

  return true;
};
