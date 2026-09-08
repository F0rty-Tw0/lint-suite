import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget,
  createCompilerHost,
  createProgram,
  createSourceFile
} from 'typescript';
import type {
  CompilerHost,
  CompilerOptions,
  Program,
  ResolvedModuleWithFailedLookupLocations,
  SourceFile
} from 'typescript';

import { fixtureDirectory } from './fixture-project.spec.util.ts';

const COMPILER_OPTIONS: CompilerOptions = {
  noLib: true,
  target: ScriptTarget.ES2022,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.Bundler
};

export const filesProgram = (files: string[]): Program => {
  return createProgram(files, COMPILER_OPTIONS);
};

export const fixtureProgram = (name: string): Program => {
  const directory = fixtureDirectory(name);
  const entries = readdirSync(directory);
  const sources = entries.filter((entry) => entry.endsWith('.ts'));
  const files = sources.map((entry) => join(directory, entry));

  return filesProgram(files);
};

export const fixtureSourceFile = (
  program: Program,
  name: string,
  file: string
): SourceFile => {
  const path = join(fixtureDirectory(name), file);
  const sourceFile = program.getSourceFile(path);

  assert.ok(sourceFile, `${name}/${file} must be part of the program`);

  return sourceFile;
};

const normalised = (path: string): string => {
  return path.replaceAll('\\', '/');
};

export const editedSourceFile = (
  program: Program,
  name: string,
  file: string,
  text: string
): SourceFile => {
  const original = fixtureSourceFile(program, name, file);

  return createSourceFile(original.fileName, text, ScriptTarget.ES2022, true);
};

/** A host that serves the previous Program's source file objects, like an editor's document registry. */
const reusingHost = (
  program: Program,
  options: CompilerOptions,
  edited: SourceFile | undefined
): CompilerHost => {
  const host = createCompilerHost(options);
  const readSourceFile = host.getSourceFile;
  const editedName = normalised(edited?.fileName ?? '');

  host.getSourceFile = (fileName, ...rest): SourceFile | undefined => {
    const path = normalised(fileName);
    const isEdited = path === editedName;

    if (isEdited) return edited;

    return program.getSourceFile(fileName) ?? readSourceFile(fileName, ...rest);
  };

  return host;
};

export const derivedProgram = (
  program: Program,
  rootFiles: string[],
  edited: SourceFile | undefined,
  options: CompilerOptions = {}
): Program => {
  const compilerOptions = { ...COMPILER_OPTIONS, ...options };
  const host = reusingHost(program, compilerOptions, edited);

  return createProgram(rootFiles, compilerOptions, host);
};

const unresolved: ResolvedModuleWithFailedLookupLocations = {
  resolvedModule: undefined
};

/**
 * A derived Program whose module resolution fails for every specifier, like
 * an editor's project service that never watched a new file appear.
 */
export const staleProgram = (
  program: Program,
  rootFiles: string[]
): Program => {
  const host = reusingHost(program, COMPILER_OPTIONS, undefined);

  host.resolveModuleNameLiterals = (
    literals
  ): ResolvedModuleWithFailedLookupLocations[] =>
    literals.map(() => unresolved);

  return createProgram(rootFiles, COMPILER_OPTIONS, host);
};
