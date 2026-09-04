import { SignatureKind, TypeFlags } from 'typescript';
import type { ClassLikeDeclaration, TypeChecker } from 'typescript';

import type { ReadSegment, ReadSink } from '../common/project-usage.type.js';
import {
  stringIndexTypes,
  symbolsForName
} from '../utils/type-property-symbols.util.js';

const isAnyOrUnknown = (types: { flags: TypeFlags }[]): boolean =>
  types.some(
    (type) => (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0
  );

export const addResolvedPath = (
  declaration: ClassLikeDeclaration,
  names: ReadSegment[],
  checker: TypeChecker,
  sink: ReadSink,
  allowMissingRoot: boolean
): boolean => {
  let types = [checker.getTypeAtLocation(declaration)];

  for (const [index, segment] of names.entries()) {
    for (const type of types) {
      sink.addType(type);
    }

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

    for (const symbol of symbols) {
      for (const memberDeclaration of symbol.declarations ?? []) {
        sink.addDeclaration(memberDeclaration);
      }
    }

    types = [...symbols].map((symbol) =>
      checker.getTypeOfSymbolAtLocation(symbol, declaration)
    );

    if (segment.called) {
      const returnTypes = types.flatMap((type) =>
        checker
          .getSignaturesOfType(type, SignatureKind.Call)
          .map((signature) => signature.getReturnType())
      );

      if (returnTypes.length === 0) return isAnyOrUnknown(types);

      types = returnTypes;
    }
  }

  return true;
};
