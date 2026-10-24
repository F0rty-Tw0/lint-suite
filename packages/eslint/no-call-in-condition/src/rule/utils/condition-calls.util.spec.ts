import assert from 'node:assert/strict';

import { isProgram } from '@lint-suite/rule-test-support/utils/parsed-program.spec.util.ts';
import { TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';
import { test } from 'vitest';

import {
  calleeName,
  conditionParts,
  constFeed,
  isFedConst
} from './condition-calls.util.ts';
import { parseCondition } from '../test/utils/parsed-condition.spec.util.ts';

const calledNames = (code: string): (string | undefined)[] => {
  const { condition } = parseCondition(code);
  const { calls } = conditionParts(condition);

  return calls.map((call) => calleeName(call.callee));
};

const feedInitType = (code: string): string | undefined => {
  const { condition, scope } = parseCondition(code);
  const identifier = conditionParts(condition).identifiers.at(0);

  assert.ok(identifier);

  const feed = constFeed(identifier, scope);

  return feed?.init.type;
};

const declaresFeed = (code: string): boolean => {
  const { ast } = tseslint.parser.parseForESLint(code);

  assert.ok(isProgram(ast), 'parser must return a Program');

  const statement = ast.body.at(0);

  assert.ok(statement?.type === TSESTree.AST_NODE_TYPES.VariableDeclaration);

  return isFedConst(statement);
};

test('collects a bare call in the condition', () => {
  assert.deepEqual(calledNames('if (validate(order)) {}'), ['validate']);
});

test('walks through negation, logical, and comparison operators', () => {
  const code = 'if (!isReady && count(items) > 2) {}';

  assert.deepEqual(calledNames(code), ['count']);
});

test('collects every call of a nested logical tree', () => {
  const code = 'if (first() || (second() && third())) {}';

  assert.deepEqual(calledNames(code), ['first', 'second', 'third']);
});

test('collects identifier leaves alongside calls', () => {
  const { condition } = parseCondition('if (isReady && hasStock) {}');
  const { calls, identifiers } = conditionParts(condition);
  const names = identifiers.map((identifier) => identifier.name);

  assert.equal(calls.length, 0);
  assert.deepEqual(names, ['isReady', 'hasStock']);
});

test('stops at a node type outside the walked shapes', () => {
  const { condition } = parseCondition('if (order.lines.every(check)) {}');
  const { calls, identifiers } = conditionParts(condition);

  assert.equal(calls.length, 1);
  assert.equal(identifiers.length, 0);
});

test('stops at a conditional expression', () => {
  const { condition } = parseCondition('if (flag ? first() : x) {}');

  assert.equal(conditionParts(condition).calls.length, 0);
});

test('names a member callee by its property', () => {
  assert.deepEqual(calledNames('if (guards.isFoo(value)) {}'), ['isFoo']);
});

test('has no name for a computed or expression callee', () => {
  assert.deepEqual(calledNames('if (guards["isFoo"](value)) {}'), [undefined]);
  assert.deepEqual(calledNames('if ((first || second)()) {}'), [undefined]);
});

test('feeds the initializer of a boolean const', () => {
  const lines = [
    'const isNamed = check(entry) && entry.name;',
    'if (isNamed) {}'
  ];
  const code = lines.join('\n');

  assert.equal(feedInitType(code), TSESTree.AST_NODE_TYPES.LogicalExpression);
});

test('skips a const that already holds a bare call', () => {
  const lines = ['const isNamed = check(entry);', 'if (isNamed) {}'];
  const code = lines.join('\n');

  assert.equal(feedInitType(code), undefined);
});

test('skips a const that holds a nullish fallback value', () => {
  const lines = [
    "const severity = printed.get(name) ?? 'absent';",
    'if (severity !== expected) {}'
  ];
  const code = lines.join('\n');

  assert.equal(feedInitType(code), undefined);
});

test('skips a let binding and an unresolved identifier', () => {
  const lines = ['let isNamed = check(entry) && other;', 'if (isNamed) {}'];
  const code = lines.join('\n');

  assert.equal(feedInitType(code), undefined);
  assert.equal(feedInitType('if (isNamed) {}'), undefined);
});

test('flags a const whose initializer feeds a call into an if', () => {
  const code = 'const isNamed = check(entry) && entry.name;';

  assert.equal(declaresFeed(code), true);
});

test('flags a const whose later declarator feeds a call', () => {
  const code = 'const size = 1, isNamed = check(entry) && entry.name;';

  assert.equal(declaresFeed(code), true);
});

test('flags a destructured const whose initializer feeds a call', () => {
  assert.equal(declaresFeed('const { data } = load(key) || {};'), true);
  assert.equal(declaresFeed('const [first] = pick(list) || [];'), true);
});

test('flags no const that holds a bare call or a nullish fallback', () => {
  assert.equal(declaresFeed('const isNamed = check(entry);'), false);
  assert.equal(declaresFeed('const size = read(key) ?? 0;'), false);
});

test('flags no let binding and no const without a call', () => {
  const letCode = 'let isNamed = check(entry) && entry.name;';

  assert.equal(declaresFeed(letCode), false);
  assert.equal(declaresFeed('const isNamed = a && b;'), false);
});
