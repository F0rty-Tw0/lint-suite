import { dirname, normalize } from 'node:path';

import type { Program, SourceFile, TypeChecker } from 'typescript';

import type {
  FileEntry,
  LazyChecker,
  ProjectIndex,
  TemplateFileVersion
} from './common/project-index.type.ts';
import { computeEntry } from './project-file-entry.ts';
import { reconcileClasses } from './project-index-classes.ts';
import {
  addEntry,
  currentSourceFiles,
  dropEntries,
  dropEntriesMentioning,
  dropReplacedEntries,
  dropStaleTemplateEntries,
  hasStaleTemplate,
  indexableSourceFiles
} from './project-index-staleness.ts';

const lazyChecker = (program: Program): LazyChecker => {
  let typeChecker: TypeChecker | undefined;

  return () => (typeChecker ??= program.getTypeChecker());
};

const isDangling = (entry: FileEntry): boolean => entry.dangling;

const indexMissingEntries = (
  index: ProjectIndex,
  sourceFiles: Iterable<SourceFile>,
  checker: LazyChecker
): void => {
  for (const sourceFile of sourceFiles) {
    const isEntryIndexed = index.entries.has(sourceFile.fileName);

    if (isEntryIndexed) continue;

    addEntry(index, computeEntry(index, sourceFile, checker()));
  }
};

const reindexProgram = (
  index: ProjectIndex,
  program: Program,
  checker: LazyChecker
): void => {
  const indexable = indexableSourceFiles(program);
  const current = currentSourceFiles(program);

  dropReplacedEntries(index, current);
  dropEntries(index, isDangling);

  const newNames = reconcileClasses(index, indexable, current, checker);

  dropEntriesMentioning(index, newNames);

  index.program = program;
  dropStaleTemplateEntries(index, false);
  indexMissingEntries(index, indexable, checker);
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

  indexMissingEntries(index, indexableSourceFiles(program), checker);
};

const isLocalEntry = (
  entry: FileEntry,
  sourceFile: SourceFile,
  directory: string
): boolean => {
  const isOwn = entry.sourceFile === sourceFile;

  if (isOwn) return true;

  const isNearby = (version: TemplateFileVersion): boolean => {
    return version.directory === directory;
  };

  return entry.templateVersions.some(isNearby);
};

const refreshLocalEntries = (
  index: ProjectIndex,
  program: Program,
  fileName: string,
  checker: LazyChecker
): void => {
  const sourceFile = program.getSourceFile(fileName);

  if (!sourceFile) return;

  const directory = dirname(normalize(sourceFile.fileName));
  const stale: FileEntry[] = [];

  for (const entry of index.entries.values()) {
    if (entry.templateVersions.length === 0) continue;

    const isLocal = isLocalEntry(entry, sourceFile, directory);

    if (!isLocal) continue;

    const isStale = hasStaleTemplate(entry);

    if (isStale) stale.push(entry);
  }

  for (const entry of stale) {
    addEntry(index, computeEntry(index, entry.sourceFile, checker()));
  }
};

export const reconcile = (
  index: ProjectIndex,
  program: Program,
  fileName: string
): void => {
  const checker = lazyChecker(program);
  const isNewProgram = index.program !== program;

  if (isNewProgram) {
    reindexProgram(index, program, checker);
  } else {
    refreshTemplateEntries(index, program, checker);
  }

  refreshLocalEntries(index, program, fileName, checker);
};
