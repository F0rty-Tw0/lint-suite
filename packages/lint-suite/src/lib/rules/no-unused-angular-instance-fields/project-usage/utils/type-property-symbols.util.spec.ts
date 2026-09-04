import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'vitest';

import { createProgram, isIdentifier, isVariableStatement } from 'typescript';
import type { Type, VariableDeclaration } from 'typescript';

import { fixtureDirectory } from '../../utils/fixture-project.spec.util.js';
import {
  stringIndexTypes,
  symbolsForName
} from './type-property-symbols.util.js';

const sampleFilename = join(fixtureDirectory('type-properties'), 'sample.ts');
const program = createProgram([sampleFilename], { noLib: true });
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(sampleFilename);

assert.ok(sourceFile, 'type-properties fixture must be part of the program');

const declarations = new Map<string, VariableDeclaration>();

sourceFile.forEachChild((node) => {
  const isVariableDeclarationList = isVariableStatement(node);

  if (!isVariableDeclarationList) return;

  for (const declaration of node.declarationList.declarations) {
    const isNamedDeclaration = isIdentifier(declaration.name);

    if (isNamedDeclaration) {
      declarations.set(declaration.name.text, declaration);
    }
  }
});

const typeOf = (name: string): Type => {
  const declaration = declarations.get(name);

  assert.ok(declaration, `missing sample declaration: ${name}`);

  return checker.getTypeAtLocation(declaration.name);
};

test('finds a property declared directly on an object type', () => {
  assert.deepEqual(
    symbolsForName(checker, typeOf('left'), 'onlyLeft').map((symbol) =>
      symbol.getName()
    ),
    ['onlyLeft']
  );
});

test('finds a property shared by every union member', () => {
  assert.deepEqual(
    symbolsForName(checker, typeOf('either'), 'shared').map((symbol) =>
      symbol.getName()
    ),
    ['shared']
  );
});

test('finds a property present on only one union member', () => {
  assert.deepEqual(
    symbolsForName(checker, typeOf('either'), 'onlyRight').map((symbol) =>
      symbol.getName()
    ),
    ['onlyRight']
  );
});

test('returns no symbols for a name no member declares', () => {
  assert.deepEqual(symbolsForName(checker, typeOf('either'), 'absent'), []);
});

test('finds the string index type of an indexed object type', () => {
  const [indexedType, ...rest] = stringIndexTypes(checker, typeOf('indexed'));

  assert.deepEqual(rest, []);
  assert.ok(indexedType);
  assert.equal(checker.typeToString(indexedType), 'string');
});

test('finds a string index type carried by one union member', () => {
  assert.equal(stringIndexTypes(checker, typeOf('maybeIndexed')).length, 1);
});

test('returns no index types for an object type without one', () => {
  assert.deepEqual(stringIndexTypes(checker, typeOf('left')), []);
});
