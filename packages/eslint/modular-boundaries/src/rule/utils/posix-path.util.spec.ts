import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { toPosixPath } from './posix-path.util.ts';

test('toPosixPath joins native path segments with forward slashes', (): void => {
  const path = toPosixPath(join('libs', 'a', 'package.json'));

  assert.equal(path, 'libs/a/package.json');
});
