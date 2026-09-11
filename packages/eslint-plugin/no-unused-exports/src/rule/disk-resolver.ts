import { resolveModuleName, sys } from 'typescript';
import type { Program } from 'typescript';

import type { DiskResolver } from './common/no-unused-exports.type.ts';

/**
 * Resolves a specifier the checker could not against the disk as it is now.
 * An editor's project service never retries a failed resolution, so a file
 * created after its import was written stays unknown to the checker.
 */
export const diskResolver = (program: Program): DiskResolver => {
  const options = program.getCompilerOptions();

  return (specifier) => {
    const containingFile = specifier.getSourceFile().fileName;
    const { resolvedModule } = resolveModuleName(
      specifier.text,
      containingFile,
      options,
      sys
    );

    if (!resolvedModule) return undefined;

    return program.getSourceFile(resolvedModule.resolvedFileName);
  };
};
