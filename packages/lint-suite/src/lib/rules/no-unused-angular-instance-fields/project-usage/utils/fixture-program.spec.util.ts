import assert from 'node:assert/strict';
import { join } from 'node:path';

import { createProgram } from 'typescript';
import type { Program, SourceFile, TypeChecker } from 'typescript';

import { fixtureDirectory } from '../../utils/fixture-project.spec.util.ts';

export type FixtureProgram = {
  readonly program: Program;
  readonly checker: TypeChecker;
  readonly sourceFile: SourceFile;
};

/** A real Program over one fixture file, with its checker and source file. */
export const fixtureProgram = (
  fixtureName: string,
  fileName: string
): FixtureProgram => {
  const filePath = join(fixtureDirectory(fixtureName), fileName);
  const program = createProgram([filePath], { noLib: true });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filePath);

  assert.ok(
    sourceFile,
    `${fixtureName}/${fileName} must be part of the program`
  );

  const fixture: FixtureProgram = { program, checker, sourceFile };

  return fixture;
};
