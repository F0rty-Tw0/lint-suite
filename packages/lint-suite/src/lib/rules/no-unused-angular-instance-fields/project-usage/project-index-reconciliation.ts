import type { Program, SourceFile, TypeChecker } from 'typescript';

import { angularClasses } from './angular/angular-component-discovery.js';
import {
  buildDirectiveIndex,
  directiveShape,
  templateFileIsCurrent
} from './angular/angular-template-reads.js';
import type {
  FileClasses,
  FileEntry,
  ProjectIndex,
  TemplateFileVersion
} from './common/project-usage.type.js';
import { computeEntry } from './project-file-entry.js';
import { collectCandidateNames } from './typescript/typescript-reads.js';
import { isSpecFile } from './utils/spec-file.util.js';

const indexableSourceFiles = (program: Program): SourceFile[] =>
  program
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile &&
        !program.isSourceFileFromExternalLibrary(sourceFile) &&
        !isSpecFile(sourceFile.fileName) &&
        /\.(?:[cm]?ts|tsx)$/u.test(sourceFile.fileName)
    );

const dropEntries = (
  index: ProjectIndex,
  stale: (entry: FileEntry) => boolean
): void => {
  for (const [fileName, entry] of index.entries) {
    if (stale(entry)) {
      index.entries.delete(fileName);
    }
  }
};

// ponytail: while the Program is unchanged (a full lint), re-stat external
// templates at most every 100x the cost of the last check so the
// O(files x templates) stat churn stays around 1% of lint time. A new
// Program (an editor save) always checks.
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
    if (
      current.get(fileClasses.sourceFile.fileName) !== fileClasses.sourceFile
    ) {
      return false;
    }

    for (const dependency of fileClasses.dependencies) {
      if (all.get(dependency.fileName) !== dependency) return false;
    }

    return true;
  };

  for (const [fileName, fileClasses] of index.classes) {
    if (!isCurrent(fileClasses)) {
      index.classes.delete(fileName);
      changed = true;
    }
  }

  for (const [fileName, sourceFile] of current) {
    if (index.classes.has(fileName)) continue;

    const candidateNames = collectCandidateNames(sourceFile);

    for (const name of candidateNames) {
      if (!index.candidateNames.has(name)) {
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
    // Re-discovered metadata may point at another template; the file's
    // own reads must be collected again.
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
      if (current.get(entry.sourceFile.fileName) !== entry.sourceFile) {
        return true;
      }

      for (const dependency of entry.dependencies) {
        if (all.get(dependency.fileName) !== dependency) return true;
      }

      return false;
    });

    const newNames = reconcileClasses(index, current, all, checker);

    // A member name seen for the first time may have been skipped as a
    // non-candidate read in files that still look current.
    if (newNames.size > 0 && index.entries.size > 0) {
      const names = [...newNames];

      dropEntries(index, (entry) =>
        names.some((name) => entry.sourceFile.text.includes(name))
      );
    }

    index.program = program;
    index.usage = undefined;
    dropStaleTemplateEntries(index, true);

    for (const [fileName, sourceFile] of current) {
      if (!index.entries.has(fileName)) {
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
    if (!index.entries.has(sourceFile.fileName)) {
      index.entries.set(
        sourceFile.fileName,
        computeEntry(index, sourceFile, checker())
      );
    }
  }
};
