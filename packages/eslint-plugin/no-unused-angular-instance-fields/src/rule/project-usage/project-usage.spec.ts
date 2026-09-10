import assert from 'node:assert/strict';
import { join } from 'node:path';

import { createProgram } from 'typescript';
import type { Program } from 'typescript';
import { test } from 'vitest';

import { projectUsage, projectUsageIsCurrent } from './project-usage.ts';
import { fixtureDirectory } from '../test/utils/fixture-project.spec.util.ts';

const CONFIG_FILE_PATH = 'project-usage.spec.tsconfig.json';

const fixtureFile = join(
  fixtureDirectory('project-discovery'),
  'chain.directive.ts'
);

const programAt = (configFilePath: string): Program => {
  return createProgram([fixtureFile], { configFilePath, noLib: true });
};

test('indexes a program under its tsconfig and treats a later program for the same config as fresh', () => {
  const first = programAt(CONFIG_FILE_PATH);

  assert.equal(projectUsageIsCurrent(first), false);

  const firstUsage = projectUsage(first, fixtureFile);

  assert.ok(firstUsage);
  assert.equal(projectUsageIsCurrent(first), true);

  const second = programAt(CONFIG_FILE_PATH);
  const secondUsage = projectUsage(second, fixtureFile);

  assert.ok(secondUsage);
  assert.equal(projectUsageIsCurrent(second), true);
  assert.equal(projectUsageIsCurrent(first), false);
});

test('returns null and never reports current when compiler options carry no config path', () => {
  const program = createProgram([fixtureFile], { noLib: true });

  assert.equal(projectUsage(program, fixtureFile), null);
  assert.equal(projectUsageIsCurrent(program), false);
});
