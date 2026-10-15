import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  parseJson,
  parseJsonc,
  parseLines,
  parseYaml,
  parserFor
} from './parse-config.util.ts';

test('parseJsonc accepts comments and trailing commas', (): void => {
  const result = parseJsonc('{ // c\n "tags": ["a"], }', '/w/turbo.json');
  const data = { tags: ['a'] };

  assert.deepEqual(result, { ok: true, data });
});

test('parseJsonc returns a JSON-safe message for malformed text', (): void => {
  const result = parseJsonc('{ "a": ', '/w/project.json');

  assert.equal(result.ok, false);
  assert.doesNotThrow((): string => JSON.stringify(result));
});

test('parseJsonc reports malformed text at a Windows path as a failure', (): void => {
  const result = parseJsonc('{ "a": ', 'C:\\w\\project.json');

  assert.equal(result.ok, false);
});

test('parseJson parses strict JSON', (): void => {
  const result = parseJson('{ "name": "a" }', '/w/package.json');
  const data = { name: 'a' };

  assert.deepEqual(result, { ok: true, data });
});

test('parseJson accepts a leading UTF-8 BOM', (): void => {
  const result = parseJson('\uFEFF{ "name": "a" }', '/w/package.json');
  const data = { name: 'a' };

  assert.deepEqual(result, { ok: true, data });
});

test('parseJson returns a JSON-safe message instead of throwing', (): void => {
  const result = parseJson('{ nope', '/w/package.json');

  assert.equal(result.ok, false);
  assert.doesNotThrow((): string => JSON.stringify(result));
});

test('parseYaml parses a mapping', (): void => {
  const result = parseYaml('projects:\n  - libs/*\n', '/w/moon.yml');
  const data = { projects: ['libs/*'] };

  assert.deepEqual(result, { ok: true, data });
});

test('parseYaml reports the yaml error message', (): void => {
  const result = parseYaml('a: [', '/w/moon.yml');

  assert.equal(result.ok, false);
  assert.equal(typeof result.message, 'string');
});

test('parseLines keeps trimmed non-empty non-comment lines', (): void => {
  const result = parseLines('# c\n\n  /dist/ \nlibs/a\n', '/w/.nxignore');

  assert.deepEqual(result, { ok: true, data: ['/dist/', 'libs/a'] });
});

test('parserFor picks the parser by basename', (): void => {
  assert.equal(parserFor('/w/libs/a/package.json'), parseJson);
  assert.equal(parserFor('/w/moon.yml'), parseYaml);
  assert.equal(parserFor('/w/pnpm-workspace.yaml'), parseYaml);
  assert.equal(parserFor('/w/.nxignore'), parseLines);
  assert.equal(parserFor('/w/project.json'), parseJsonc);
  assert.equal(parserFor('/w/tsconfig.base.json'), parseJsonc);
  assert.equal(parserFor('/w/nx.json'), parseJsonc);
});
