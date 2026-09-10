import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  classExpressionLiterals,
  classExpressionUsage
} from './class-expression-literals.util.ts';

test('splits a string literal into its class names', () => {
  const names = classExpressionLiterals("'lit-a lit-b'");

  assert.deepEqual(names, ['lit-a', 'lit-b']);
});

test('reads every non-spread key of an object literal', () => {
  const names = classExpressionLiterals("{ 'map-a': c, 'map-b map-c': o }");

  assert.deepEqual(names, ['map-a', 'map-b', 'map-c']);
});

test('skips a spread entry of an object literal', () => {
  const names = classExpressionLiterals("{ ...rest, 'map-a': c }");

  assert.deepEqual(names, ['map-a']);
});

test('recurses into the elements of an array literal', () => {
  const names = classExpressionLiterals("['arr-a', 'arr-b arr-c']");

  assert.deepEqual(names, ['arr-a', 'arr-b', 'arr-c']);
});

test('reads both branches of a conditional', () => {
  const names = classExpressionLiterals("c ? 'tern-a' : 'tern-b'");

  assert.deepEqual(names, ['tern-a', 'tern-b']);
});

test('reads the literal parts of an interpolated attribute value', () => {
  const names = classExpressionLiterals('s1 {{ q }} s2');

  assert.deepEqual(names, ['s1', 's2']);
});

test('reads nothing from an identifier', () => {
  assert.deepEqual(classExpressionLiterals('dynamic'), []);
});

test('reads nothing from a concatenation', () => {
  assert.deepEqual(classExpressionLiterals("'pre-' + kind"), []);
});

test('reads nothing from a call or a pipe', () => {
  assert.deepEqual(classExpressionLiterals('classesOf(item) | async'), []);
});

test('reads nothing from an expression it cannot parse', () => {
  assert.deepEqual(classExpressionLiterals("{ 'a' "), []);
});

test('keeps the first occurrence of a repeated class name', () => {
  const names = classExpressionLiterals("['dup', 'dup other']");

  assert.deepEqual(names, ['dup', 'other']);
});

test('reads a literal string as static class names', () => {
  const usage = classExpressionUsage("'lit-a lit-b'");

  assert.deepEqual(usage.names, ['lit-a', 'lit-b']);
  assert.deepEqual(usage.patterns, []);
  assert.equal(usage.isDynamic, false);
});

test('reads the literal keys of an object literal as names', () => {
  const usage = classExpressionUsage("{ 'map-a': c, 'map-b map-c': o }");

  assert.deepEqual(usage.names, ['map-a', 'map-b', 'map-c']);
  assert.equal(usage.isDynamic, false);
});

test('treats a spread key of an object literal as dynamic', () => {
  const usage = classExpressionUsage("{ ...rest, 'map-a': c }");

  assert.deepEqual(usage.names, ['map-a']);
  assert.equal(usage.isDynamic, true);
});

test('reads both branches of a conditional of literals', () => {
  const usage = classExpressionUsage("c ? 'tern-a' : 'tern-b'");

  assert.deepEqual(usage.names, ['tern-a', 'tern-b']);
  assert.equal(usage.isDynamic, false);
});

test('reads an array literal of literal strings', () => {
  const usage = classExpressionUsage("['arr-a', 'arr-b arr-c']");

  assert.deepEqual(usage.names, ['arr-a', 'arr-b', 'arr-c']);
  assert.equal(usage.isDynamic, false);
});

test('treats a call expression as dynamic', () => {
  const usage = classExpressionUsage('classes()');

  assert.deepEqual(usage.names, []);
  assert.equal(usage.isDynamic, true);
});

test('treats a concatenation as dynamic', () => {
  const usage = classExpressionUsage("'a ' + b");

  assert.deepEqual(usage.names, []);
  assert.equal(usage.isDynamic, true);
});

test('treats an expression it cannot parse as dynamic', () => {
  const usage = classExpressionUsage("{ 'a' ");

  assert.deepEqual(usage.names, []);
  assert.equal(usage.isDynamic, true);
});

test('turns an interpolated suffix into an anchored pattern', () => {
  const usage = classExpressionUsage('badge badge--{{ v }}');

  assert.deepEqual(usage.names, ['badge']);
  assert.deepEqual(usage.patterns, ['^badge--.*$']);
  assert.equal(usage.isDynamic, false);
});

test('treats a whole interpolated token as dynamic', () => {
  const usage = classExpressionUsage('a {{ b }}');

  assert.deepEqual(usage.names, ['a']);
  assert.deepEqual(usage.patterns, []);
  assert.equal(usage.isDynamic, true);
});
