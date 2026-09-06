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
import type { CompilerOptions, Program, SourceFile } from 'typescript';

import { fixtureDirectory } from './fixture-project.spec.util.ts';

const COMPILER_OPTIONS: CompilerOptions = {
  noLib: true,
  target: ScriptTarget.ES2022,
  module: ModuleKind.ESNext,
  moduleResolution: ModuleResolutionKind.Bundler
};

export const fixtureProgram = (name: string): Program => {
  const directory = fixtureDirectory(name);
  const entries = readdirSync(directory);
  const sources = entries.filter((entry) => entry.endsWith('.ts'));
  const files = sources.map((entry) => join(directory, entry));

  return createProgram(files, COMPILER_OPTIONS);
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

export const derivedProgram = (
  program: Program,
  rootFiles: string[],
  edited: SourceFile | undefined
): Program => {
  const host = createCompilerHost(COMPILER_OPTIONS);
  const editedPath = edited?.fileName ?? '';
  const editedName = normalised(editedPath);

  host.getSourceFile = (fileName): SourceFile | undefined => {
    const path = normalised(fileName);
    const isEdited = path === editedName;

    if (isEdited) return edited;

    return program.getSourceFile(fileName);
  };

  return createProgram(rootFiles, COMPILER_OPTIONS, host);
};
