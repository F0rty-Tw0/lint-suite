import assert from 'node:assert/strict';

import { ScriptTarget, createSourceFile } from 'typescript';
import { test } from 'vitest';

import { collectCandidateNames } from './typescript-candidate-names.ts';

const namesIn = (code: string): string[] => {
  const sourceFile = createSourceFile('sample.ts', code, ScriptTarget.Latest);
  const names = collectCandidateNames(sourceFile);

  return [...names].sort();
};

test('collects members of decorated classes, including string-named ones', () => {
  const names = namesIn(`
    @Component({})
    class Widget {
      value = 1;
      'quoted' = 2;
      run(): void {}
    }
  `);

  assert.deepEqual(names, ['quoted', 'run', 'value']);
});

test('ignores classes without decorators', () => {
  const names = namesIn(`
    class Plain {
      value = 1;
    }
  `);

  assert.deepEqual(names, []);
});

test('skips computed member names', () => {
  const names = namesIn(`
    const key = 'dynamic';

    @Component({})
    class Widget {
      [key] = 1;
      fixed = 2;
    }
  `);

  assert.deepEqual(names, ['fixed']);
});
