import type { Program, SourceFile, TypeChecker } from 'typescript';

import type { LazyChecker, ProjectIndex } from './common/project-index.type.ts';
import { computeEntry } from './project-file-entry.ts';
import { reconcileClasses } from './project-index-classes.ts';
import {
  dropEntriesMentioning,
  dropReplacedEntries,
  dropStaleTemplateEntries,
  indexableSourceFiles,
  sourceFileMaps
} from './project-index-staleness.ts';

const lazyChecker = (program: Program): LazyChecker => {
  let typeChecker: TypeChecker | undefined;

  return () => (typeChecker ??= program.getTypeChecker());
};

const indexMissingEntries = (
  index: ProjectIndex,
  sourceFiles: Iterable<SourceFile>,
  checker: LazyChecker
): void => {
  for (const sourceFile of sourceFiles) {
    const isEntryIndexed = index.entries.has(sourceFile.fileName);

    if (isEntryIndexed) continue;

    const entry = computeEntry(index, sourceFile, checker());

    index.entries.set(sourceFile.fileName, entry);
  }
};

const reindexProgram = (
  index: ProjectIndex,
  program: Program,
  checker: LazyChecker
): void => {
  const maps = sourceFileMaps(program);

  dropReplacedEntries(index, maps);

  const newNames = reconcileClasses(index, maps, checker);

  dropEntriesMentioning(index, newNames);

  index.program = program;
  index.usage = undefined;
  dropStaleTemplateEntries(index, true);
  indexMissingEntries(index, maps.current.values(), checker);
};

const refreshTemplateEntries = (
  index: ProjectIndex,
  program: Program,
  checker: LazyChecker
): void => {
  const entryCount = index.entries.size;

  dropStaleTemplateEntries(index, false);

  const isUnchanged = index.entries.size === entryCount;

  if (isUnchanged) return;

  index.usage = undefined;
  indexMissingEntries(index, indexableSourceFiles(program), checker);
};

export const reconcile = (index: ProjectIndex, program: Program): void => {
  const checker = lazyChecker(program);
  const isNewProgram = index.program !== program;

  if (isNewProgram) {
    reindexProgram(index, program, checker);

    return;
  }

  refreshTemplateEntries(index, program, checker);
};
