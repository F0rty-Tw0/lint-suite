import assert from 'node:assert/strict';
import { join } from 'node:path';

import { test } from 'vitest';

import { dropDuplicateProjects } from './duplicate-projects.util.ts';
import type { Project } from '../common/modular-boundaries.type.ts';

const root = '/w';

const at = (...segments: string[]): string => join(root, ...segments);

const project = (
  projectRoot: string,
  id: string,
  packageName?: string
): Project => {
  const created: Project = {
    id,
    root: projectRoot,
    tags: [],
    declaredDependencies: [],
    hasOwnPackageJson: packageName !== undefined
  };

  if (packageName === undefined) return created;

  const named: Project = { ...created, packageName };

  return named;
};

test('three projects sharing a name give one error per pair', (): void => {
  const projects = [
    project(at('a'), 'a', 'dup'),
    project(at('b'), 'b', 'dup'),
    project(at('c'), 'c', 'dup'),
    project(at('d'), 'd', 'kept')
  ];
  const manifests = new Set([
    at('a', 'package.json'),
    at('b', 'package.json'),
    at('c', 'package.json')
  ]);
  const checked = dropDuplicateProjects(root, projects, manifests);
  const ids = checked.projects.map((kept) => kept.id);
  const files = checked.errors.map((error) => error.file);

  assert.deepEqual(ids, ['d']);
  assert.deepEqual(files, [
    at('b', 'package.json'),
    at('c', 'package.json'),
    at('c', 'package.json')
  ]);
});

test('an id clash and a name clash on one pair are one error naming both', (): void => {
  const projects = [
    project(at('x'), 'same', 'pkg'),
    project(at('y'), 'same', 'pkg')
  ];
  const manifests = new Set([at('x', 'package.json'), at('y', 'project.json')]);
  const { errors } = dropDuplicateProjects(root, projects, manifests);

  assert.deepEqual(errors, [
    {
      file: at('y', 'project.json'),
      message:
        "Duplicate project id 'same' and package name 'pkg' (also in x/package.json)."
    }
  ]);
});

test('the later manifest in sorted path order carries the error', (): void => {
  const projects = [project(at('a'), 'same'), project(at('b'), 'same')];
  const manifests = new Set([at('a', 'project.json'), at('b', 'moon.yml')]);
  const { errors } = dropDuplicateProjects(root, projects, manifests);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, [at('b', 'moon.yml')]);
});

test('the error lands on the first project when its manifest sorts later', (): void => {
  const projects = [project(at('a'), 'same'), project(at('a-b'), 'same')];
  const manifests = new Set([
    at('a', 'package.json'),
    at('a-b', 'package.json')
  ]);
  const { errors } = dropDuplicateProjects(root, projects, manifests);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, [at('a', 'package.json')]);
});

test('manifests sort in POSIX path order whatever the platform separator', (): void => {
  const projects = [project(at('a'), 'same'), project(at('a0'), 'same')];
  const manifests = new Set([
    at('a', 'package.json'),
    at('a0', 'package.json')
  ]);
  const { errors } = dropDuplicateProjects(root, projects, manifests);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, [at('a0', 'package.json')]);
});
