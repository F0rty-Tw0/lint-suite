import { SignatureKind, TypeFlags } from 'typescript';
import type { ClassLikeDeclaration, Type, TypeChecker } from 'typescript';

import type { ReadSegment, ReadSink } from '../common/project-usage.type.js';
import {
  stringIndexTypes,
  symbolsForName
} from '../utils/type-property-symbols.util.js';

const hasAnyOrUnknownFlag = (type: { flags: TypeFlags }): boolean => {
  const anyOrUnknown = TypeFlags.Any | TypeFlags.Unknown;

  return (type.flags & anyOrUnknown) !== 0;
};

const isAnyOrUnknown = (types: { flags: TypeFlags }[]): boolean => {
  return types.some(hasAnyOrUnknownFlag);
};

export const addResolvedPath = (
  declaration: ClassLikeDeclaration,
  names: ReadSegment[],
  checker: TypeChecker,
  sink: ReadSink,
  allowMissingRoot: boolean
): boolean => {
  const indexTypes = (type: Type): Type[] => stringIndexTypes(checker, type);
  const callReturnTypes = (type: Type): Type[] => {
    const signatures = checker.getSignaturesOfType(type, SignatureKind.Call);

    return signatures.map((signature) => signature.getReturnType());
  };

  let types = [checker.getTypeAtLocation(declaration)];

  for (const [index, segment] of names.entries()) {
    for (const type of types) {
      sink.addType(type);
    }

    const symbols = new Set(
      types.flatMap((type) => symbolsForName(checker, type, segment.name))
    );

    if (symbols.size === 0) {
      const indexedTypes = types.flatMap(indexTypes);

      if (indexedTypes.length > 0) {
        types = indexedTypes;
        continue;
      }

      const isAnyOrUnknownType = isAnyOrUnknown(types);

      if (isAnyOrUnknownType) return true;

      return index === 0 && allowMissingRoot;
    }

    const symbolTypes: Type[] = [];

    for (const symbol of symbols) {
      for (const memberDeclaration of symbol.declarations ?? []) {
        sink.addDeclaration(memberDeclaration);
      }

      symbolTypes.push(checker.getTypeOfSymbolAtLocation(symbol, declaration));
    }

    types = symbolTypes;

    if (segment.called) {
      const returnTypes = types.flatMap(callReturnTypes);

      if (returnTypes.length === 0) return isAnyOrUnknown(types);

      types = returnTypes;
    }
  }

  return true;
};
