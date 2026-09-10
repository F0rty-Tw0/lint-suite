import type { Node, SourceFile, Type, TypeChecker } from 'typescript';

import { collectAngularTemplateReads } from './angular/angular-template-reads.ts';
import type {
  FileEntry,
  ProjectIndex,
  TemplateReads
} from './common/project-index.type.ts';
import type { ReadSink } from './common/project-usage.type.ts';
import { hasDanglingImport } from './typescript/typescript-dangling-imports.ts';
import { collectTypeScriptReads } from './typescript/typescript-reads.ts';
import { addTypeDependencies } from './typescript/typescript-type-dependencies.ts';

const failureText = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  return String(error);
};

const collectFileReads = (
  index: ProjectIndex,
  sourceFile: SourceFile,
  checker: TypeChecker,
  sink: ReadSink
): TemplateReads => {
  try {
    collectTypeScriptReads(sourceFile, checker, sink, index.candidateNames);

    const classes = index.classes.get(sourceFile.fileName)?.classes ?? [];

    return collectAngularTemplateReads({
      allNames: index.candidateNames,
      checker,
      classes,
      directives: index.directives,
      sink
    });
  } catch (error) {
    const errorMessage = failureText(error);

    sink.addFallbackNames(
      index.candidateNames,
      `${sourceFile.fileName}: indexing failed (${errorMessage})`
    );

    const noTemplateReads: TemplateReads = {
      templateVersions: [],
      usedDirectiveIndex: false
    };

    return noTemplateReads;
  }
};

/**
 * A file with a dangling import reads through untyped values, so every
 * candidate member it mentions counts as read until the import resolves.
 */
const addDanglingFallback = (
  index: ProjectIndex,
  sourceFile: SourceFile,
  mentionedNames: ReadonlySet<string>,
  sink: ReadSink
): void => {
  const isCandidate = (name: string): boolean => index.candidateNames.has(name);
  const mentioned = [...mentionedNames];
  const names = mentioned.filter(isCandidate);
  const reason = `${sourceFile.fileName}: an import resolves to no module`;

  sink.addFallbackNames(names, reason);
};

export const computeEntry = (
  index: ProjectIndex,
  sourceFile: SourceFile,
  checker: TypeChecker
): FileEntry => {
  const declarations = new Set<Node>();
  const dependencies = new Set<SourceFile>();
  const fallbackNames = new Set<string>();
  const mentionedNames = new Set<string>();
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
    addMention: (name) => {
      mentionedNames.add(name);
    },
    addType: (type) => {
      addTypeDependencies(checker, type, dependencies, seenTypes);
    }
  };
  const reads = collectFileReads(index, sourceFile, checker, sink);
  const dangling = hasDanglingImport(sourceFile, checker);

  if (dangling) addDanglingFallback(index, sourceFile, mentionedNames, sink);

  dependencies.delete(sourceFile);

  const fileEntry: FileEntry = {
    ...reads,
    dangling,
    declarations,
    dependencies,
    fallbackNames,
    mentionedNames,
    sourceFile
  };

  return fileEntry;
};
