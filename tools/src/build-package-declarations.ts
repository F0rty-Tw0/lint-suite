import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import ts from 'typescript';

import type {
  BuildPackageContext,
  PackageDependencyMap
} from './common/build-package.type.ts';
import {
  declarationPath,
  rewrittenDeclaration
} from './build-package-declaration-path.ts';

const umbrellaPaths = (context: BuildPackageContext): ts.MapLike<string[]> => {
  const dependencies: PackageDependencyMap = {
    ...(context.manifest.dependencies ?? {}),
    ...(context.manifest.peerDependencies ?? {})
  };
  const paths: ts.MapLike<string[]> = {};

  for (const name of Object.keys(dependencies)) {
    if (!name.startsWith('@lint-suite/')) continue;

    const dependencyRoot = context.publicPackageRoots[name];

    if (!dependencyRoot) {
      throw new Error(`Private dependency leaked: ${name}`);
    }

    paths[name] = [resolve('dist', dependencyRoot, 'index.d.ts')];
  }

  return paths;
};

const declarationCompilerOptions = (
  context: BuildPackageContext,
  parsed: ts.ParsedCommandLine
): ts.CompilerOptions => {
  const paths = context.isUmbrella ? umbrellaPaths(context) : undefined;
  const options: ts.CompilerOptions = {
    ...parsed.options,
    ...(paths ? { paths } : {}),
    composite: false,
    customConditions: context.isUmbrella ? [] : ['development'],
    declaration: true,
    declarationMap: false,
    emitDeclarationOnly: true,
    incremental: false,
    noEmit: false,
    outDir: context.outputRoot,
    rootDir: context.workspaceRoot
  };

  return options;
};

export const emitPackageDeclarations = async (
  context: BuildPackageContext
): Promise<boolean> => {
  const configPath = resolve(context.packageRoot, 'tsconfig.lib.json');
  const readSource = (path: string): string | undefined =>
    ts.sys.readFile(path);
  const config = ts.readConfigFile(configPath, readSource);

  if (config.error) {
    const message = ts.flattenDiagnosticMessageText(
      config.error.messageText,
      '\n'
    );

    throw new Error(message);
  }

  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    dirname(configPath)
  );
  const options = declarationCompilerOptions(context, parsed);
  const ambientDeclarations = parsed.fileNames.filter((file): boolean =>
    file.endsWith('.d.ts')
  );
  const roots = [...context.entryPoints, ...ambientDeclarations];
  const resolvedProgram = ts.createProgram(roots, options);
  const isPrivateSource = (source: ts.SourceFile): boolean => {
    const privatePath = relative(context.privateRoot, source.fileName);
    const isWithinPrivateRoot =
      !privatePath.startsWith('..') && !isAbsolute(privatePath);

    return isWithinPrivateRoot && !source.isDeclarationFile;
  };
  const sharedSources = resolvedProgram
    .getSourceFiles()
    .filter(isPrivateSource);
  const sources = sharedSources.map((source): string => source.fileName);
  const program =
    sources.length === 0
      ? resolvedProgram
      : ts.createProgram(
          [...roots, ...sources],
          options,
          undefined,
          resolvedProgram
        );
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    const host: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (file): string => file,
      getCurrentDirectory: (): string => context.workspaceRoot,
      getNewLine: (): string => '\n'
    };
    const formatted = ts.formatDiagnosticsWithColorAndContext(
      diagnostics,
      host
    );

    console.error(formatted);
    process.exitCode = 1;

    return false;
  }

  const pending: Promise<void>[] = [];
  const writeDeclaration: ts.WriteFileCallback = (
    fileName,
    text,
    byteOrderMark,
    onError,
    sourceFiles
  ): void => {
    void byteOrderMark;
    void onError;
    const source = sourceFiles?.[0];
    const isDeclaration = fileName.endsWith('.d.ts');

    if (!source || !isDeclaration) return;

    const destination = declarationPath(context, source.fileName);
    const rewritten = rewrittenDeclaration(
      context,
      destination,
      fileName,
      text
    );
    const write = mkdir(dirname(destination), { recursive: true }).then(
      (): Promise<void> => writeFile(destination, rewritten)
    );
    pending.push(write);
  };

  program.emit(undefined, writeDeclaration);
  await Promise.all(pending);

  return true;
};
