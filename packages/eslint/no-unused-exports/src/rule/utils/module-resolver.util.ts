import { isStringLiteralLike } from 'typescript';
import type { Expression, Node, SourceFile, TypeChecker } from 'typescript';

import type {
  IsExternalFile,
  ModuleResolution,
  ModuleResolver
} from '../common/no-unused-exports.type.ts';

const declarationOf = (
  specifier: Expression,
  checker: TypeChecker
): Node | undefined => {
  const symbol = checker.getSymbolAtLocation(specifier);

  if (!symbol) return undefined;

  return symbol.valueDeclaration ?? symbol.declarations?.[0];
};

const declaredSourceFile = (
  specifier: Expression,
  checker: TypeChecker
): SourceFile | undefined => {
  const declaration = declarationOf(specifier, checker);

  if (!declaration) return undefined;

  return declaration.getSourceFile();
};

const moduleTarget = (
  sourceFile: SourceFile,
  isExternal: IsExternalFile
): string | undefined => {
  if (sourceFile.isDeclarationFile) return undefined;

  const isSourceExternal = isExternal(sourceFile);

  if (isSourceExternal) return undefined;

  return sourceFile.fileName;
};

/**
 * Resolves a specifier to the project file it names: through the checker
 * first, then the disk when the checker knows nothing. A literal specifier
 * found nowhere is listed in `dangling`.
 */
export const moduleResolver = (
  resolution: ModuleResolution,
  dangling: string[]
): ModuleResolver => {
  const { checker, isExternal, onDisk } = resolution;

  return (specifier) => {
    if (!specifier) return undefined;

    const declared = declaredSourceFile(specifier, checker);

    if (declared) return moduleTarget(declared, isExternal);

    if (!isStringLiteralLike(specifier)) return undefined;

    const found = onDisk(specifier);

    if (found) return moduleTarget(found, isExternal);

    dangling.push(specifier.text);

    return undefined;
  };
};
