import type { Node, SourceFile, Type, TypeChecker } from 'typescript';

import { collectAngularTemplateReads } from './angular/angular-template-reads.ts';
import type {
  FileEntry,
  ProjectIndex,
  ReadSink,
  TemplateReads
} from './common/project-usage.type.ts';
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

export const computeEntry = (
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
  const reads = collectFileReads(index, sourceFile, checker, sink);

  dependencies.delete(sourceFile);

  const fileEntry: FileEntry = {
    ...reads,
    declarations,
    dependencies,
    fallbackNames,
    sourceFile
  };

  return fileEntry;
};
