import { preProcessFile } from 'typescript';

import type { FileReference } from 'typescript';

const nameOf = (reference: FileReference): string => reference.fileName;

/**
 * Import specifiers of a source text (static, type, re-export, `require`,
 * dynamic `import`), read by the TypeScript scanner without building an AST.
 */
export const extractSpecifiers = (text: string): string[] => {
  const { importedFiles } = preProcessFile(text, true, true);

  return importedFiles.map(nameOf);
};
