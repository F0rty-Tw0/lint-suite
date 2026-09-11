import assert from 'node:assert/strict';

import { test } from 'vitest';

import { linkedStylesheetHrefs } from './template-links.util.ts';

test('reads relative stylesheet hrefs in document order', () => {
  const templateLines = [
    '<link rel="stylesheet" href="../shared/index.css" />',
    '<link rel="stylesheet" href="theme.css">'
  ];
  const template = templateLines.join('\n');

  assert.deepEqual(linkedStylesheetHrefs(template), [
    '../shared/index.css',
    'theme.css'
  ]);
});

test('skips root-relative, protocol-relative, and absolute URLs', () => {
  const templateLines = [
    '<link rel="stylesheet" href="/theme.css">',
    '<link rel="stylesheet" href="//cdn.example.com/theme.css">',
    '<link rel="stylesheet" href="https://cdn.example.com/theme.css">'
  ];
  const template = templateLines.join('\n');

  assert.deepEqual(linkedStylesheetHrefs(template), []);
});

test('skips links that are not stylesheets or have no href', () => {
  const templateLines = [
    '<link rel="icon" href="theme.css">',
    '<link href="theme.css">',
    '<link rel="stylesheet">',
    '<link rel="stylesheet" href="">'
  ];
  const template = templateLines.join('\n');

  assert.deepEqual(linkedStylesheetHrefs(template), []);
});

test('reads single-quoted attributes in any order', () => {
  const template = "<link href='theme.css' rel='stylesheet'>";

  assert.deepEqual(linkedStylesheetHrefs(template), ['theme.css']);
});
