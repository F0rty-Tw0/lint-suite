import type { Expression, Node, TypeChecker } from 'typescript';

import type { IsExternalFile } from '../common/no-unused-exports.type.ts';

const declarationOf = (
  specifier: Expression,
  checker: TypeChecker
): Node | undefined => {
  const symbol = checker.getSymbolAtLocation(specifier);

  if (!symbol) return undefined;

  return symbol.valueDeclaration ?? symbol.declarations?.[0];
};

export const moduleTarget = (
  specifier: Expression | undefined,
  checker: TypeChecker,
  isExternal: IsExternalFile
): string | undefined => {
  if (!specifier) return undefined;

  const declaration = declarationOf(specifier, checker);

  if (!declaration) return undefined;

  const sourceFile = declaration.getSourceFile();

  if (sourceFile.isDeclarationFile) return undefined;

  const isSourceExternal = isExternal(sourceFile);

  if (isSourceExternal) return undefined;

  return sourceFile.fileName;
};
