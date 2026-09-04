import type { Node, SourceFile, Type, TypeChecker } from 'typescript';

import { collectAngularTemplateReads } from './angular/angular-template-reads.js';
import type {
  FileEntry,
  ProjectIndex,
  ReadSink,
  TemplateReads
} from './common/project-usage.type.js';
import { collectTypeScriptReads } from './typescript/typescript-reads.js';
import { addTypeDependencies } from './typescript/typescript-type-dependencies.js';

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

  const fileEntry: FileEntry = {
    ...reads,
    declarations,
    dependencies,
    fallbackNames,
    sourceFile
  };

  return fileEntry;
};
