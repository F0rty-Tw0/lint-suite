import assert from 'node:assert/strict';

import { test } from 'vitest';

import { isExemptCall } from './call-exemptions.util.ts';
import { conditionParts } from './condition-calls.util.ts';
import { parseCondition } from './parsed-condition.spec.util.ts';
import type { CallExemptions } from '../common/no-call-in-condition.type.ts';

const isExempt = (code: string, allowed: RegExp[] = []): boolean => {
  const { condition, scope } = parseCondition(code);
  const call = conditionParts(condition).calls.at(0);

  assert.ok(call);

  const exemptions: CallExemptions = { allowed, scope, services: undefined };

  return isExemptCall(call, exemptions);
};

test('exempts a zero-argument signal read on this', () => {
  assert.equal(isExempt('if (this.loading()) {}'), true);
});

test('reports a this call that takes arguments', () => {
  assert.equal(isExempt('if (this.check(1)) {}'), false);
});

test('reports a nested this chain and a computed this member', () => {
  assert.equal(isExempt('if (this.store.ready()) {}'), false);
  assert.equal(isExempt('if (this["ready"]()) {}'), false);
});

test('exempts an arrow const whose return type is a predicate', () => {
  const lines = [
    'const looksLikeFoo = (value: unknown): value is Foo => true;',
    'if (looksLikeFoo(input)) {}'
  ];
  const code = lines.join('\n');

  assert.equal(isExempt(code), true);
});

test('exempts a function declaration returning a predicate', () => {
  const lines = [
    'function looksLikeFoo(value: unknown): value is Foo { return true; }',
    'if (looksLikeFoo(input)) {}'
  ];
  const code = lines.join('\n');

  assert.equal(isExempt(code), true);
});

test('exempts an ambient function declared with a predicate', () => {
  const lines = [
    'declare function looksLikeFoo(value: unknown): value is Foo;',
    'if (looksLikeFoo(input)) {}'
  ];
  const code = lines.join('\n');

  assert.equal(isExempt(code), true);
});

test('reports a same-file function returning a plain boolean', () => {
  const lines = [
    'const compute = (value: number): boolean => value > 0;',
    'if (compute(input)) {}'
  ];
  const code = lines.join('\n');

  assert.equal(isExempt(code), false);
});

test('reports a member callee that scope cannot resolve', () => {
  const lines = [
    'const guards = { looksLikeFoo: (value: unknown): value is Foo => true };',
    'if (guards.looksLikeFoo(input)) {}'
  ];
  const code = lines.join('\n');

  assert.equal(isExempt(code), false);
});

test('exempts a callee name matching an allowed pattern', () => {
  const allowed = [/^(is|has)[A-Z]/u];

  assert.equal(isExempt('if (isFoo(input)) {}', allowed), true);
  assert.equal(isExempt('if (compute(input)) {}', allowed), false);
});

test('matches an allowed pattern against a member property name', () => {
  const allowed = [/^(is|has)[A-Z]/u];

  assert.equal(isExempt('if (guards.isFoo(input)) {}', allowed), true);
});

test('reports a callee with no derivable name', () => {
  const allowed = [/^(is|has)[A-Z]/u];

  assert.equal(isExempt('if (guards["isFoo"](input)) {}', allowed), false);
});
