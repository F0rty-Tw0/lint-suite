import {
  isClassElement,
  isIdentifier,
  isStringLiteralLike,
  ObjectFlags,
  TypeFlags
} from 'typescript';
import type {
  InterfaceType,
  Node,
  ObjectType,
  Program,
  SourceFile,
  Type,
  TypeChecker,
  TypeReference
} from 'typescript';

import { angularClasses } from './angular/angular-component-discovery.js';
import type { AngularClass } from './angular/angular-component-discovery.js';
import type { DirectiveIndex } from './angular/angular-template-read-resolution.js';
import {
  buildDirectiveIndex,
  collectAngularTemplateReads,
  directiveShape,
  templateFileIsCurrent
} from './angular/angular-template-reads.js';
import type {
  TemplateFileVersion,
  TemplateReads
} from './angular/angular-template-reads.js';
import type {
  ProjectUsageIndex,
  ReadSink
} from './common/project-usage.type.js';
import {
  collectCandidateNames,
  collectTypeScriptReads
} from './typescript/typescript-reads.js';
import { isSpecFile } from './utils/spec-file.js';

/**
 * Everything one source file contributes to the index: the member
 * declarations it reads, and the files whose contents those resolutions
 * depended on. The entry stays valid while every one of those `SourceFile`
 * objects is still the one the current Program holds.
 */
type FileEntry = {
  readonly declarations: ReadonlySet<Node>;
  readonly dependencies: ReadonlySet<SourceFile>;
  /** Names treated as read because this file could not be indexed exactly. */
  readonly fallbackNames: ReadonlySet<string>;
  readonly sourceFile: SourceFile;
  readonly templateVersions: readonly TemplateFileVersion[];
  readonly usedDirectiveIndex: boolean;
};

type FileClasses = {
  readonly candidateNames: ReadonlySet<string>;
  readonly classes: readonly AngularClass[];
  /** Files the discovered metadata resolved through (aliases, constants). */
  readonly dependencies: ReadonlySet<SourceFile>;
  readonly sourceFile: SourceFile;
};

type ProjectIndex = {
  /** Member names of decorated classes; only ever grows within a session. */
  readonly candidateNames: Set<string>;
  readonly classes: Map<string, FileClasses>;
  directives: DirectiveIndex;
  directiveShape: string;
  readonly entries: Map<string, FileEntry>;
  program: Program | null;
  templateCheckDuration: number;
  templateCheckedAt: number;
  usage: ProjectUsageIndex | undefined;
};

const indexes = new Map<string, ProjectIndex>();

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

const addTypeDependencies = (
  checker: TypeChecker,
  type: Type,
  dependencies: Set<SourceFile>,
  seen: Set<Type>
): void => {
  if (seen.has(type)) {
    return;
  }

  seen.add(type);

  if (type.isUnionOrIntersection()) {
    for (const member of type.types) {
      addTypeDependencies(checker, member, dependencies, seen);
    }

    return;
  }

  for (const symbol of [type.getSymbol(), type.aliasSymbol]) {
    for (const declaration of symbol?.declarations ?? []) {
      dependencies.add(declaration.getSourceFile());
    }
  }

  if ((type.flags & TypeFlags.TypeParameter) !== 0) {
    const constraint = checker.getBaseConstraintOfType(type);

    if (constraint) {
      addTypeDependencies(checker, constraint, dependencies, seen);
    }

    return;
  }

  if ((type.flags & TypeFlags.Object) === 0) {
    return;
  }

  const objectType = type as ObjectType;
  const target =
    (objectType.objectFlags & ObjectFlags.Reference) !== 0
      ? (type as TypeReference).target
      : objectType;

  if ((target.objectFlags & ObjectFlags.ClassOrInterface) !== 0) {
    for (const base of checker.getBaseTypes(target as InterfaceType)) {
      addTypeDependencies(checker, base, dependencies, seen);
    }
  }
};

const computeEntry = (
  index: ProjectIndex,
  sourceFile: SourceFile,
  checker: TypeChecker
): FileEntry => {
  const declarations = new Set<Node>();
  const dependencies = new Set<SourceFile>();
  const fallbackNames = new Set<string>();
  const seenTypes = new Set<Type>();
  const sink: ReadSink = {
    addDeclaration: (declaration) => {
      declarations.add(declaration);
      dependencies.add(declaration.getSourceFile());
    },
    addFallbackNames: (names) => {
      for (const name of names) {
        fallbackNames.add(name);
      }
    },
    addType: (type) => {
      addTypeDependencies(checker, type, dependencies, seenTypes);
    }
  };
  let reads: TemplateReads = {
    templateVersions: [],
    usedDirectiveIndex: false
  };

  try {
    collectTypeScriptReads(sourceFile, checker, sink, index.candidateNames);

    reads = collectAngularTemplateReads(
      index.classes.get(sourceFile.fileName)?.classes ?? [],
      checker,
      sink,
      index.directives,
      index.candidateNames
    );
  } catch (error) {
    sink.addFallbackNames(
      index.candidateNames,
      `${sourceFile.fileName}: indexing failed (${error instanceof Error ? error.message : String(error)})`
    );
  }

  dependencies.delete(sourceFile);

  return { ...reads, declarations, dependencies, fallbackNames, sourceFile };
};

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
      if (all.get(dependency.fileName) !== dependency) {
        return false;
      }
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
    if (index.classes.has(fileName)) {
      continue;
    }

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

const reconcile = (index: ProjectIndex, program: Program): void => {
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
        if (all.get(dependency.fileName) !== dependency) {
          return true;
        }
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

  if (index.entries.size === entries) {
    return;
  }

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

const memberName = (node: Node): string | null =>
  isClassElement(node) &&
  node.name &&
  (isIdentifier(node.name) || isStringLiteralLike(node.name))
    ? node.name.text
    : null;

const usageOf = (index: ProjectIndex): ProjectUsageIndex => {
  if (index.usage !== undefined) {
    return index.usage;
  }

  const declarations = new Set<Node>();
  const fallbackNames = new Set<string>();

  for (const entry of index.entries.values()) {
    for (const declaration of entry.declarations) {
      declarations.add(declaration);
    }

    for (const name of entry.fallbackNames) {
      fallbackNames.add(name);
    }
  }

  index.usage = {
    has: (node) => {
      if (declarations.has(node)) {
        return true;
      }

      if (fallbackNames.size === 0) {
        return false;
      }

      const name = memberName(node);

      return name !== null && fallbackNames.has(name);
    }
  };

  return index.usage;
};

const createIndex = (): ProjectIndex => ({
  candidateNames: new Set(),
  classes: new Map(),
  directives: buildDirectiveIndex([]),
  directiveShape: '',
  entries: new Map(),
  program: null,
  templateCheckDuration: 0,
  templateCheckedAt: 0,
  usage: undefined
});

/**
 * True when the index already reflects this exact Program, so callers can
 * skip local work the index duplicates (such as parsing a component's own
 * template) without ever triggering a build.
 */
export const projectUsageIsCurrent = (program: Program): boolean => {
  const configFilePath = program.getCompilerOptions()['configFilePath'];

  return (
    typeof configFilePath === 'string' &&
    indexes.get(configFilePath)?.program === program
  );
};

/**
 * Member declarations read anywhere in the Program's non-spec TypeScript
 * and Angular templates, or null when the project cannot be indexed
 * reliably. Indexes are kept per tsconfig and updated incrementally: a new
 * Program (an edit in the editor) only re-indexes the files that changed
 * and the files whose resolutions depended on them.
 */
export const projectUsage = (program: Program): ProjectUsageIndex | null => {
  const configFilePath = program.getCompilerOptions()['configFilePath'];

  if (typeof configFilePath !== 'string') {
    return null;
  }

  let index = indexes.get(configFilePath);

  if (!index) {
    index = createIndex();
    indexes.set(configFilePath, index);
  }

  try {
    reconcile(index, program);

    return usageOf(index);
  } catch {
    indexes.delete(configFilePath);

    return null;
  }
};
