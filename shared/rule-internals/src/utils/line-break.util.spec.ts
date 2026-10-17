import assert from 'node:assert/strict';

import { test } from 'vitest';

import { lineBreakOf } from './line-break.util.ts';

test('returns CRLF for text whose first line ends in CRLF', () => {
  assert.equal(lineBreakOf('a;\r\nb;\r\n'), '\r\n');
});

test('returns LF for text whose first line ends in LF', () => {
  assert.equal(lineBreakOf('a;\nb;\n'), '\n');
});

test('follows the first line break of mixed text', () => {
  assert.equal(lineBreakOf('a;\nb;\r\n'), '\n');
  assert.equal(lineBreakOf('a;\r\nb;\n'), '\r\n');
});

test('returns LF for text without a line break', () => {
  assert.equal(lineBreakOf('a;'), '\n');
  assert.equal(lineBreakOf(''), '\n');
});

test('returns LF when the text starts with a line break', () => {
  assert.equal(lineBreakOf('\na;'), '\n');
});
