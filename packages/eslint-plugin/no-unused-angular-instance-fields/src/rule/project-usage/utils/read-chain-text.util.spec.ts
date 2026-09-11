import assert from 'node:assert/strict';

import { test } from 'vitest';

import { chainText } from './read-chain-text.util.ts';
import type { ReadSegment } from '../common/project-usage.type.ts';

const plainSegment: ReadSegment = { called: false, name: 'form' };
const calledSegment: ReadSegment = { called: true, name: 'control' };
const trailingSegment: ReadSegment = { called: false, name: 'value' };

test('joins plain segments with a dot', () => {
  const names = [plainSegment, trailingSegment];

  assert.equal(chainText(names), 'form.value');
});

test('marks a called segment with empty parentheses', () => {
  const names = [plainSegment, calledSegment, trailingSegment];

  assert.equal(chainText(names), 'form.control().value');
});

test('renders an empty chain as an empty string', () => {
  const names: ReadSegment[] = [];

  assert.equal(chainText(names), '');
});
