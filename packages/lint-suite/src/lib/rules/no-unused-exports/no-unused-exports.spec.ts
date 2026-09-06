import type { RuleTester } from 'eslint';

import { fixtureDirectory } from './utils/fixture-project.spec.util.ts';
import {
  exportError,
  invalidCase,
  moduleError,
  rule,
  ruleName,
  validCase
} from './utils/rule-under-test.spec.util.ts';
import { projectRuleTester } from '../utils/project-rule-tester.spec.util.ts';

const directory = fixtureDirectory('unused-exports');
const tester = projectRuleTester(directory);

const valid: RuleTester.ValidTestCase[] = [
  validCase('accepts an export imported by another file', directory, 'used.ts'),
  validCase(
    'accepts a type export imported with import type',
    directory,
    'types.type.ts'
  ),
  validCase('skips entry point files', directory, 'main.ts'),
  validCase(
    'accepts a star barrel that a consumer imports through',
    directory,
    'star-barrel.ts'
  ),
  validCase('accepts a file in an import cycle', directory, 'cycle-a.ts'),
  validCase(
    'accepts the other file in an import cycle',
    directory,
    'cycle-b.ts'
  ),
  validCase(
    'accepts a consumer that is imported by main',
    directory,
    'consumer.ts'
  ),
  validCase(
    'accepts every export behind an entry point star re-export',
    directory,
    'published-star.ts'
  )
];

const invalid: RuleTester.InvalidTestCase[] = [
  invalidCase(
    'reports an export nobody imports while the file is imported',
    directory,
    'orphan.ts',
    [exportError('orphanUnused')]
  ),
  invalidCase(
    'reports a module that no other file imports',
    directory,
    'orphan-module.ts',
    [moduleError]
  ),
  invalidCase(
    'reports a re-exported name nobody imports in the barrel',
    directory,
    'barrel.ts',
    [exportError('barrelDead')]
  ),
  invalidCase(
    'reports the origin of a re-exported name nobody imports',
    directory,
    'origin.ts',
    [exportError('barrelDead')]
  ),
  invalidCase(
    'reports an export reached only through an unused star barrel',
    directory,
    'star-origin.ts',
    [exportError('starDead')]
  ),
  invalidCase(
    'reports a star barrel that no other file imports',
    directory,
    'orphan-star.ts',
    [moduleError]
  ),
  invalidCase(
    'accepts a name an entry point re-exports and reports the rest',
    directory,
    'published.ts',
    [exportError('publishedDead')]
  )
];

tester.run(ruleName, rule, { valid, invalid });
