import type { Program, SourceFile } from 'typescript';

import { templateFileIsCurrent } from './angular/angular-template-reads.ts';
import type {
  FileEntry,
  ProjectIndex,
  SourceFileMaps,
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

export const sourceFileMaps = (program: Program): SourceFileMaps => {
  const all = new Map<string, SourceFile>();
  const current = new Map<string, SourceFile>();

  for (const sourceFile of program.getSourceFiles()) {
    all.set(sourceFile.fileName, sourceFile);
  }

  for (const sourceFile of indexableSourceFiles(program)) {
    current.set(sourceFile.fileName, sourceFile);
  }

  const maps: SourceFileMaps = { all, current };

  return maps;
};

export const dropEntries = (
  index: ProjectIndex,
  stale: (entry: FileEntry) => boolean
): void => {
  for (const [fileName, entry] of index.entries) {
    const isStale = stale(entry);

    if (isStale) {
      index.entries.delete(fileName);
    }
  }
};

export const isReplaced = (
  sourceFile: SourceFile,
  dependencies: ReadonlySet<SourceFile>,
  maps: SourceFileMaps
): boolean => {
  const indexedSourceFile = maps.current.get(sourceFile.fileName);

  if (indexedSourceFile !== sourceFile) return true;

  for (const dependency of dependencies) {
    const indexedDependency = maps.all.get(dependency.fileName);

    if (indexedDependency !== dependency) return true;
  }

  return false;
};

export const dropReplacedEntries = (
  index: ProjectIndex,
  maps: SourceFileMaps
): void => {
  const isEntryReplaced = (entry: FileEntry): boolean => {
    return isReplaced(entry.sourceFile, entry.dependencies, maps);
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
    return nameList.some((name) => entry.sourceFile.text.includes(name));
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
  const hasStaleTemplate = (entry: FileEntry): boolean => {
    return !entry.templateVersions.every(isCurrent);
  };

  dropEntries(index, hasStaleTemplate);

  index.templateCheckedAt = now;
  index.templateCheckDuration = performance.now() - now;
};
