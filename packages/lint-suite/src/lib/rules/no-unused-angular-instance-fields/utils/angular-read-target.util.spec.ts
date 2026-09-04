import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  AbsoluteSourceSpan,
  ImplicitReceiver,
  KeyedRead,
  LiteralPrimitive,
  ParseSpan,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead
} from '@angular/compiler';

import { isReadTarget } from './angular-read-target.util.js';

const span = new ParseSpan(0, 0);
const sourceSpan = new AbsoluteSourceSpan(0, 0);
const receiver = new ImplicitReceiver(span, sourceSpan);
const key = new LiteralPrimitive(span, sourceSpan, 'key');

test('accepts a property read', () => {
  const node = new PropertyRead(span, sourceSpan, sourceSpan, receiver, 'name');

  assert.equal(isReadTarget(node), true);
});

test('accepts a safe property read', () => {
  const node = new SafePropertyRead(
    span,
    sourceSpan,
    sourceSpan,
    receiver,
    'name'
  );

  assert.equal(isReadTarget(node), true);
});

test('accepts a keyed read', () => {
  const node = new KeyedRead(span, sourceSpan, receiver, key);

  assert.equal(isReadTarget(node), true);
});

test('accepts a safe keyed read', () => {
  const node = new SafeKeyedRead(span, sourceSpan, receiver, key);

  assert.equal(isReadTarget(node), true);
});

test('rejects an expression that reads nothing', () => {
  assert.equal(isReadTarget(key), false);
});
