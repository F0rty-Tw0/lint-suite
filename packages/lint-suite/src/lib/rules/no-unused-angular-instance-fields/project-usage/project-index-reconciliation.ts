import type { Program, SourceFile, TypeChecker } from 'typescript';

import { angularClasses } from './angular/angular-component-discovery.ts';
import {
  buildDirectiveIndex,
  directiveShape
} from './angular/angular-directive-index.ts';
import { templateFileIsCurrent } from './angular/angular-template-reads.ts';
import type {
  FileClasses,
  FileEntry,
  ProjectIndex,
  TemplateFileVersion
} from './common/project-usage.type.ts';
import { computeEntry } from './project-file-entry.ts';
import { collectCandidateNames } from './typescript/typescript-reads.ts';
import { isSpecFile } from './utils/spec-file.util.ts';

const typeScriptFilePattern = /\.(?:[cm]?ts|tsx)$/u;

const indexableSourceFiles = (program: Program): SourceFile[] => {
  const isIndexable = (sourceFile: SourceFile): boolean => {
    if (sourceFile.isDeclarationFile) return false;

    const isExternal = program.isSourceFileFromExternalLibrary(sourceFile);

    if (isExternal) return false;

    const isSpec = isSpecFile(sourceFile.fileName);

    if (isSpec) return false;

    return typeScriptFilePattern.test(sourceFile.fileName);
  };

  const sourceFiles = program.getSourceFiles();

  return sourceFiles.filter(isIndexable);
};

const dropEntries = (
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

const dropStaleTemplateEntries = (
  index: ProjectIndex,
  force: boolean
): void => {
  const now = performance.now();

  if (
    !force &&
    now - index.templateCheckedAt < index.templateCheckDuration * 100
  ) {
    return;
  }

  const checked = new Map<string, boolean>();
  const isCurrent = (version: TemplateFileVersion): boolean => {
    const key = `${version.fileName}\0${version.mtimeNs}\0${version.size}`;
    let current = checked.get(key);

    if (current === undefined) {
      current = templateFileIsCurrent(version);
      checked.set(key, current);
    }

    return current;
  };

  dropEntries(index, (entry) => !entry.templateVersions.every(isCurrent));

  index.templateCheckedAt = now;
  index.templateCheckDuration = performance.now() - now;
};

const reconcileClasses = (
  index: ProjectIndex,
  current: ReadonlyMap<string, SourceFile>,
  all: ReadonlyMap<string, SourceFile>,
  checker: () => TypeChecker
): Set<string> => {
  const newNames = new Set<string>();
  let changed = false;
  const isCurrent = (fileClasses: FileClasses): boolean => {
    const indexedSourceFile = current.get(fileClasses.sourceFile.fileName);

    if (indexedSourceFile !== fileClasses.sourceFile) return false;

    for (const dependency of fileClasses.dependencies) {
      const indexedDependency = all.get(dependency.fileName);

      if (indexedDependency !== dependency) return false;
    }

    return true;
  };

  for (const [fileName, fileClasses] of index.classes) {
    const isFileCurrent = isCurrent(fileClasses);

    if (!isFileCurrent) {
      index.classes.delete(fileName);
      changed = true;
    }
  }

  for (const [fileName, sourceFile] of current) {
    const isIndexed = index.classes.has(fileName);

    if (isIndexed) continue;

    const candidateNames = collectCandidateNames(sourceFile);

    for (const name of candidateNames) {
      const isKnownName = index.candidateNames.has(name);

      if (!isKnownName) {
        index.candidateNames.add(name);
        newNames.add(name);
      }
    }

    const { classes, dependencies } = angularClasses(sourceFile, checker());

    index.classes.set(fileName, {
      candidateNames,
      classes,
      dependencies,
      sourceFile
    });
    index.entries.delete(fileName);
    changed = true;
  }

  if (changed) {
    const classes = [...index.classes.values()].flatMap(
      (fileClasses) => fileClasses.classes
    );
    const shape = directiveShape(classes);

    index.directives = buildDirectiveIndex(classes);

    if (shape !== index.directiveShape) {
      index.directiveShape = shape;
      dropEntries(index, (entry) => entry.usedDirectiveIndex);
    }
  }

  return newNames;
};

export const reconcile = (index: ProjectIndex, program: Program): void => {
  let typeChecker: TypeChecker | undefined;
  const checker = (): TypeChecker => (typeChecker ??= program.getTypeChecker());

  if (index.program !== program) {
    const all = new Map<string, SourceFile>();
    const current = new Map<string, SourceFile>();

    for (const sourceFile of program.getSourceFiles()) {
      all.set(sourceFile.fileName, sourceFile);
    }

    for (const sourceFile of indexableSourceFiles(program)) {
      current.set(sourceFile.fileName, sourceFile);
    }

    dropEntries(index, (entry) => {
      const indexedSourceFile = current.get(entry.sourceFile.fileName);

      if (indexedSourceFile !== entry.sourceFile) return true;

      for (const dependency of entry.dependencies) {
        const indexedDependency = all.get(dependency.fileName);

        if (indexedDependency !== dependency) return true;
      }

      return false;
    });

    const newNames = reconcileClasses(index, current, all, checker);

    if (newNames.size > 0 && index.entries.size > 0) {
      const names = [...newNames];
      const hasNewName = (entry: FileEntry): boolean => {
        return names.some((name) => entry.sourceFile.text.includes(name));
      };

      dropEntries(index, hasNewName);
    }

    index.program = program;
    index.usage = undefined;
    dropStaleTemplateEntries(index, true);

    for (const [fileName, sourceFile] of current) {
      const isEntryIndexed = index.entries.has(fileName);

      if (!isEntryIndexed) {
        index.entries.set(fileName, computeEntry(index, sourceFile, checker()));
      }
    }

    return;
  }

  const entries = index.entries.size;

  dropStaleTemplateEntries(index, false);

  if (index.entries.size === entries) return;

  index.usage = undefined;

  for (const sourceFile of indexableSourceFiles(program)) {
    const isEntryIndexed = index.entries.has(sourceFile.fileName);

    if (!isEntryIndexed) {
      index.entries.set(
        sourceFile.fileName,
        computeEntry(index, sourceFile, checker())
      );
    }
  }
};
