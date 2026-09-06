import type { SourceFile } from 'typescript';

import { angularClasses } from './angular/angular-component-discovery.ts';
import {
  buildDirectiveIndex,
  directiveShape,
  replaceDeclarations
} from './angular/angular-directive-index.ts';
import type {
  FileClasses,
  LazyChecker,
  ProjectIndex
} from './common/project-index.type.ts';
import { dropEntries, isReplaced, removeEntry } from './project-index-staleness.ts';
import type { CurrentSourceFiles } from './project-index-staleness.ts';
import { collectCandidateNames } from './typescript/typescript-candidate-names.ts';

const dropReplacedClasses = (
  index: ProjectIndex,
  current: CurrentSourceFiles
): FileClasses[] => {
  const dropped: FileClasses[] = [];

  for (const [fileName, fileClasses] of index.classes) {
    const replaced = isReplaced(
      fileClasses.sourceFile,
      fileClasses.dependencies,
      current
    );

    if (!replaced) continue;

    index.classes.delete(fileName);
    dropped.push(fileClasses);
  }

  return dropped;
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
): FileClasses => {
  const candidateNames = collectCandidateNames(sourceFile);

  addCandidateNames(index, candidateNames, newNames);

  const { classes, dependencies } = angularClasses(sourceFile, checker());
  const shape = directiveShape(classes);
  const fileClasses: FileClasses = {
    candidateNames,
    classes,
    dependencies,
    shape,
    sourceFile
  };

  index.classes.set(sourceFile.fileName, fileClasses);
  removeEntry(index, sourceFile.fileName);

  return fileClasses;
};

const indexNewClasses = (
  index: ProjectIndex,
  current: readonly SourceFile[],
  checker: LazyChecker,
  newNames: Set<string>
): FileClasses[] => {
  const added: FileClasses[] = [];

  for (const sourceFile of current) {
    const isIndexed = index.classes.has(sourceFile.fileName);

    if (isIndexed) continue;

    added.push(indexFileClasses(index, sourceFile, checker, newNames));
  }

  return added;
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

const shapesOf = (files: FileClasses[]): string => {
  return files.map((file) => file.shape).sort().join('\n');
};

/** Same files, same selectors: repoint the index at the new declarations. */
const repointDirectives = (
  index: ProjectIndex,
  dropped: FileClasses[],
  added: FileClasses[]
): void => {
  const previous = dropped.flatMap((file) => file.classes);
  const next = added.flatMap((file) => file.classes);

  replaceDeclarations(index.directives, previous, next);
};

/** Re-index changed files' classes; returns member names never seen before. */
export const reconcileClasses = (
  index: ProjectIndex,
  indexable: readonly SourceFile[],
  current: CurrentSourceFiles,
  checker: LazyChecker
): Set<string> => {
  const newNames = new Set<string>();
  const dropped = dropReplacedClasses(index, current);
  const added = indexNewClasses(index, indexable, checker, newNames);
  const isUntouched = dropped.length === 0 && added.length === 0;

  if (isUntouched) return newNames;

  const droppedShape = shapesOf(dropped);
  const addedShape = shapesOf(added);
  const isSameShape = droppedShape === addedShape;

  if (isSameShape) {
    repointDirectives(index, dropped, added);
  } else {
    rebuildDirectives(index);
  }

  return newNames;
};
