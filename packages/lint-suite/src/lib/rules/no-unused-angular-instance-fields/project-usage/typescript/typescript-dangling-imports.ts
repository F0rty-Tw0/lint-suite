import { isImportDeclaration } from 'typescript';
import type { SourceFile, TypeChecker } from 'typescript';

/**
 * True when a binding import resolves to no module: its file may not exist
 * yet, or may still be empty. Reads through it cannot be typed, and the
 * checker of an editor session never retries a resolution that failed.
 */
export const hasDanglingImport = (
  sourceFile: SourceFile,
  checker: TypeChecker
): boolean => {
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement)) continue;

    if (!statement.importClause) continue;

    const symbol = checker.getSymbolAtLocation(statement.moduleSpecifier);

    if (!symbol) return true;
  }

  return false;
};
