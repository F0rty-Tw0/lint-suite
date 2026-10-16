import { isAbsolute, relative, resolve } from 'node:path';

import ts from 'typescript';

const isWithin = (root: string, path: string): boolean => {
  const inner = relative(root, path);

  return !inner.startsWith('..') && !isAbsolute(inner);
};

const importedSources = (
  program: ts.Program,
  source: ts.SourceFile
): ts.SourceFile[] => {
  const options = program.getCompilerOptions();
  const { importedFiles } = ts.preProcessFile(source.text, true, true);
  const imported: ts.SourceFile[] = [];

  for (const { fileName } of importedFiles) {
    const resolution = ts.resolveModuleName(
      fileName,
      source.fileName,
      options,
      ts.sys,
      undefined,
      undefined,
      source.impliedNodeFormat
    );
    const resolvedFileName = resolution.resolvedModule?.resolvedFileName;
    const target = resolvedFileName
      ? program.getSourceFile(resolvedFileName)
      : undefined;

    if (target) {
      imported.push(target);
    }
  }

  return imported;
};

export const ownPrivateSources = (
  program: ts.Program,
  sourceRoot: string,
  privateRoot: string
): string[] => {
  const isOwnSource = (source: ts.SourceFile): boolean =>
    isWithin(sourceRoot, source.fileName) && !source.isDeclarationFile;
  const isPrivateSource = (source: ts.SourceFile): boolean =>
    isWithin(privateRoot, source.fileName) && !source.isDeclarationFile;
  const pending = program.getSourceFiles().filter(isOwnSource);
  const reached = new Set<ts.SourceFile>();

  for (let source = pending.pop(); source; source = pending.pop()) {
    const imported = importedSources(program, source);
    const unseenPrivate = imported.filter(
      (target): boolean => isPrivateSource(target) && !reached.has(target)
    );

    for (const target of unseenPrivate) {
      reached.add(target);
      pending.push(target);
    }
  }

  const reachedSources = Array.from(reached);

  return reachedSources.map((source): string => resolve(source.fileName));
};
