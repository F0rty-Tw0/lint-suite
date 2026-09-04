import type { SourceFile } from 'typescript';

import { angularClasses } from './angular/angular-component-discovery.ts';
import {
  buildDirectiveIndex,
  directiveShape
} from './angular/angular-directive-index.ts';
import type {
  FileClasses,
  LazyChecker,
  ProjectIndex,
  SourceFileMaps
} from './common/project-index.type.ts';
import { dropEntries, isReplaced } from './project-index-staleness.ts';
import { collectCandidateNames } from './typescript/typescript-candidate-names.ts';

const dropReplacedClasses = (
  index: ProjectIndex,
  maps: SourceFileMaps
): boolean => {
  let changed = false;

  for (const [fileName, fileClasses] of index.classes) {
    const replaced = isReplaced(
      fileClasses.sourceFile,
      fileClasses.dependencies,
      maps
    );

    if (!replaced) continue;

    index.classes.delete(fileName);
    changed = true;
  }

  return changed;
};

const addCandidateNames = (
  index: ProjectIndex,
  candidateNames: ReadonlySet<string>,
  newNames: Set<string>
): void => {
  for (const name of candidateNames) {
    const isKnownName = index.candidateNames.has(name);

    if (isKnownName) continue;

    index.candidateNames.add(name);
    newNames.add(name);
  }
};

const indexFileClasses = (
  index: ProjectIndex,
  sourceFile: SourceFile,
  checker: LazyChecker,
  newNames: Set<string>
): void => {
  const candidateNames = collectCandidateNames(sourceFile);

  addCandidateNames(index, candidateNames, newNames);

  const { classes, dependencies } = angularClasses(sourceFile, checker());
  const fileClasses: FileClasses = {
    candidateNames,
    classes,
    dependencies,
    sourceFile
  };

  index.classes.set(sourceFile.fileName, fileClasses);
  index.entries.delete(sourceFile.fileName);
};

const indexNewClasses = (
  index: ProjectIndex,
  current: ReadonlyMap<string, SourceFile>,
  checker: LazyChecker,
  newNames: Set<string>
): boolean => {
  let changed = false;

  for (const [fileName, sourceFile] of current) {
    const isIndexed = index.classes.has(fileName);

    if (isIndexed) continue;

    indexFileClasses(index, sourceFile, checker, newNames);
    changed = true;
  }

  return changed;
};

const rebuildDirectives = (index: ProjectIndex): void => {
  const fileClasses = [...index.classes.values()];
  const classes = fileClasses.flatMap((entry) => entry.classes);
  const shape = directiveShape(classes);

  index.directives = buildDirectiveIndex(classes);

  if (shape === index.directiveShape) return;

  index.directiveShape = shape;
  dropEntries(index, (entry) => entry.usedDirectiveIndex);
};

/** Re-index changed files' classes; returns member names never seen before. */
export const reconcileClasses = (
  index: ProjectIndex,
  maps: SourceFileMaps,
  checker: LazyChecker
): Set<string> => {
  const newNames = new Set<string>();
  const droppedClasses = dropReplacedClasses(index, maps);
  const addedClasses = indexNewClasses(index, maps.current, checker, newNames);
  const changed = droppedClasses || addedClasses;

  if (changed) {
    rebuildDirectives(index);
  }

  return newNames;
};
