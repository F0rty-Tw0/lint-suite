import assert from 'node:assert/strict';

import { test } from 'vitest';

import { compileGlobs } from './glob-matcher.util.ts';

test('matches **/main.ts at the project root and inside a directory', () => {
  const isMain = compileGlobs(['**/main.ts']);

  assert.equal(isMain('main.ts'), true);
  assert.equal(isMain('a/b/main.ts'), true);
});

test('rejects **/main.ts for a name that is not an exact match', () => {
  const isMain = compileGlobs(['**/main.ts']);

  assert.equal(isMain('mainx.ts'), false);
  assert.equal(isMain('a/main.ts.bak'), false);
});

test('matches **/*.config.ts at any depth', () => {
  const isConfig = compileGlobs(['**/*.config.ts']);

  assert.equal(isConfig('foo.config.ts'), true);
  assert.equal(isConfig('a/b/foo.config.ts'), true);
  assert.equal(isConfig('foo.config.js'), false);
});

test('matches **/*.routes.ts', () => {
  const isRoutes = compileGlobs(['**/*.routes.ts']);

  assert.equal(isRoutes('app.routes.ts'), true);
  assert.equal(isRoutes('app.routes.js'), false);
});

test('matches **/*.stories.ts', () => {
  const isStories = compileGlobs(['**/*.stories.ts']);

  assert.equal(isStories('button.stories.ts'), true);
});

test('matches **/index.ts as an exact literal, not a substring', () => {
  const isIndex = compileGlobs(['**/index.ts']);

  assert.equal(isIndex('index.ts'), true);
  assert.equal(isIndex('a/index.ts'), true);
  assert.equal(isIndex('reindex.ts'), false);
});

test('matches **/environment*.ts', () => {
  const isEnvironment = compileGlobs(['**/environment*.ts']);

  assert.equal(isEnvironment('environment.ts'), true);
  assert.equal(isEnvironment('environment.prod.ts'), true);
  assert.equal(isEnvironment('a/environment.ts'), true);
  assert.equal(isEnvironment('environment.js'), false);
});

test('matches **/*.config.{ts,js,mjs,cjs} across every alternative', () => {
  const isConfig = compileGlobs(['**/*.config.{ts,js,mjs,cjs}']);

  assert.equal(isConfig('x.config.ts'), true);
  assert.equal(isConfig('x.config.js'), true);
  assert.equal(isConfig('x.config.mjs'), true);
  assert.equal(isConfig('x.config.cjs'), true);
  assert.equal(isConfig('x.config.json'), false);
});

test('matches **/eslint.config.* for any single-segment extension', () => {
  const isEslintConfig = compileGlobs(['**/eslint.config.*']);

  assert.equal(isEslintConfig('eslint.config.mjs'), true);
  assert.equal(isEslintConfig('a/eslint.config.js'), true);
  assert.equal(isEslintConfig('eslint.config'), false);
});

test('matches **/public-api.ts and **/*.spec.util.ts', () => {
  const isPublicApi = compileGlobs(['**/public-api.ts']);
  const isSpecUtil = compileGlobs(['**/*.spec.util.ts']);

  assert.equal(isPublicApi('a/b/public-api.ts'), true);
  assert.equal(isSpecUtil('a/b/parse-line.spec.util.ts'), true);
  assert.equal(isSpecUtil('a/b/parse-line.util.ts'), false);
});

test('matches **/*.d.ts without matching a plain .ts file', () => {
  const isDeclaration = compileGlobs(['**/*.d.ts']);

  assert.equal(isDeclaration('a/types.d.ts'), true);
  assert.equal(isDeclaration('a/types.ts'), false);
});

test('matches any pattern in the list, not only the first', () => {
  const isExempt = compileGlobs(['**/main.ts', '**/*.stories.ts']);

  assert.equal(isExempt('a/button.stories.ts'), true);
  assert.equal(isExempt('a/main.ts'), true);
  assert.equal(isExempt('a/other.ts'), false);
});

test('matches a Windows-style path after normalisation', () => {
  const isMain = compileGlobs(['**/main.ts']);

  assert.equal(isMain('a\\b\\main.ts'), true);
  assert.equal(isMain('a\\b\\other.ts'), false);
});
