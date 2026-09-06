import assert from 'node:assert/strict';

import type { ESLint } from 'eslint';
import { test } from 'vitest';

import { definePlugin } from './define-plugin.util.ts';

test('names the plugin in its meta', () => {
  const plugin = definePlugin('local', {});

  assert.equal(plugin.meta.name, 'local');
});

test('attaches the given rules object unchanged', () => {
  const rules = {};
  const plugin: ESLint.Plugin = definePlugin('local', rules);

  assert.equal(plugin.rules, rules);
});
