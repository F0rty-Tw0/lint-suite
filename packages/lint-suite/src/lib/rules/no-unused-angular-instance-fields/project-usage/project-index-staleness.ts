import type { Program, SourceFile } from 'typescript';

import { templateFileIsCurrent } from './angular/angular-template-reads.ts';
import type {
  CurrentSourceFiles,
  FileEntry,
  ProjectIndex,
  TemplateFileVersion
} from './common/project-index.type.ts';
import { isSpecFile } from './utils/spec-file.util.ts';

const typeScriptFilePattern = /\.(?:[cm]?ts|tsx)$/u;

const isIndexable = (program: Program, sourceFile: SourceFile): boolean => {
  if (sourceFile.isDeclarationFile) return false;

  const isExternal = program.isSourceFileFromExternalLibrary(sourceFile);

  if (isExternal) return false;

  const isSpec = isSpecFile(sourceFile.fileName);

  if (isSpec) return false;

  return typeScriptFilePattern.test(sourceFile.fileName);
};

export const indexableSourceFiles = (program: Program): SourceFile[] => {
  const sourceFiles = program.getSourceFiles();

  return sourceFiles.filter((sourceFile) => isIndexable(program, sourceFile));
};

const adjustCounts = <K>(
  counts: Map<K, number>,
  keys: Iterable<K>,
  delta: number
): void => {
  for (const key of keys) {
    const current = counts.get(key) ?? 0;
    const count = current + delta;

    if (count > 0) {
      counts.set(key, count);
    } else {
      counts.delete(key);
    }
  }
};

export const removeEntry = (index: ProjectIndex, fileName: string): void => {
  const entry = index.entries.get(fileName);

  if (!entry) return;

  index.entries.delete(fileName);
  adjustCounts(index.declarationCounts, entry.declarations, -1);
  adjustCounts(index.fallbackNameCounts, entry.fallbackNames, -1);
};

export const addEntry = (index: ProjectIndex, entry: FileEntry): void => {
  removeEntry(index, entry.sourceFile.fileName);
  index.entries.set(entry.sourceFile.fileName, entry);
  adjustCounts(index.declarationCounts, entry.declarations, 1);
  adjustCounts(index.fallbackNameCounts, entry.fallbackNames, 1);
};

export const dropEntries = (
  index: ProjectIndex,
  stale: (entry: FileEntry) => boolean
): void => {
  for (const [fileName, entry] of index.entries) {
    const isStale = stale(entry);

    if (isStale) removeEntry(index, fileName);
  }
};

/** The Program's source file objects, for identity checks without path work. */
export const currentSourceFiles = (program: Program): CurrentSourceFiles => {
  return new Set(program.getSourceFiles());
};

export const isReplaced = (
  sourceFile: SourceFile,
  dependencies: ReadonlySet<SourceFile>,
  current: CurrentSourceFiles
): boolean => {
  const isCurrent = current.has(sourceFile);

  if (!isCurrent) return true;

  for (const dependency of dependencies) {
    const isDependencyCurrent = current.has(dependency);

    if (!isDependencyCurrent) return true;
  }

  return false;
};

export const dropReplacedEntries = (
  index: ProjectIndex,
  current: CurrentSourceFiles
): void => {
  const isEntryReplaced = (entry: FileEntry): boolean => {
    return isReplaced(entry.sourceFile, entry.dependencies, current);
  };

  dropEntries(index, isEntryReplaced);
};

export const dropEntriesMentioning = (
  index: ProjectIndex,
  names: ReadonlySet<string>
): void => {
  if (names.size === 0) return;

  if (index.entries.size === 0) return;

  const nameList = [...names];
  const mentionsName = (entry: FileEntry): boolean => {
    return nameList.some((name) => entry.mentionedNames.has(name));
  };

  dropEntries(index, mentionsName);
};

const templateVersionChecker = (): ((
  version: TemplateFileVersion
) => boolean) => {
  const checked = new Map<string, boolean>();

  return (version: TemplateFileVersion): boolean => {
    const key = `${version.fileName}\0${version.mtimeNs}\0${version.size}`;
    const known = checked.get(key);

    if (known !== undefined) return known;

    const current = templateFileIsCurrent(version);

    checked.set(key, current);

    return current;
  };
};

export const hasStaleTemplate = (entry: FileEntry): boolean => {
  return !entry.templateVersions.every(templateFileIsCurrent);
};

export const dropStaleTemplateEntries = (
  index: ProjectIndex,
  force: boolean
): void => {
  const now = performance.now();
  const sinceLastCheck = now - index.templateCheckedAt;
  const isThrottled =
    !force && sinceLastCheck < index.templateCheckDuration * 100;

  if (isThrottled) return;

  const isCurrent = templateVersionChecker();
  const isStale = (entry: FileEntry): boolean => {
    return !entry.templateVersions.every(isCurrent);
  };

  dropEntries(index, isStale);

  index.templateCheckedAt = now;
  index.templateCheckDuration = performance.now() - now;
};
