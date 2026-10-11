import assert from 'node:assert/strict';

import { test } from 'vitest';

import { dropDuplicateProjects } from './duplicate-projects.util.ts';

import type { Project } from '../common/modular-boundaries.type.ts';

const project = (root: string, id: string, packageName?: string): Project => {
  const created: Project = {
    id,
    root,
    tags: [],
    declaredDependencies: [],
    hasOwnPackageJson: packageName !== undefined
  };

  if (packageName !== undefined) created.packageName = packageName;

  return created;
};

test('three projects sharing a name give one error per pair', (): void => {
  const projects = [
    project('/w/a', 'a', 'dup'),
    project('/w/b', 'b', 'dup'),
    project('/w/c', 'c', 'dup'),
    project('/w/d', 'd', 'kept')
  ];
  const manifests = new Set([
    '/w/a/package.json',
    '/w/b/package.json',
    '/w/c/package.json'
  ]);
  const checked = dropDuplicateProjects(projects, manifests);
  const ids = checked.projects.map((kept) => kept.id);
  const files = checked.errors.map((error) => error.file);

  assert.deepEqual(ids, ['d']);
  assert.deepEqual(files, [
    '/w/b/package.json',
    '/w/c/package.json',
    '/w/c/package.json'
  ]);
});

test('an id clash and a name clash on one pair are one error naming both', (): void => {
  const projects = [
    project('/w/x', 'same', 'pkg'),
    project('/w/y', 'same', 'pkg')
  ];
  const manifests = new Set(['/w/x/package.json', '/w/y/project.json']);
  const { errors } = dropDuplicateProjects(projects, manifests);

  assert.deepEqual(errors, [
    {
      file: '/w/y/project.json',
      message:
        "Duplicate project id 'same' and package name 'pkg' (also in /w/x/package.json)."
    }
  ]);
});

test('the later manifest in sorted path order carries the error', (): void => {
  const projects = [project('/w/a', 'same'), project('/w/b', 'same')];
  const manifests = new Set(['/w/a/project.json', '/w/b/moon.yml']);
  const { errors } = dropDuplicateProjects(projects, manifests);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, ['/w/b/moon.yml']);
});

test('the error lands on the first project when its manifest sorts later', (): void => {
  const projects = [project('/w/a', 'same'), project('/w/a-b', 'same')];
  const manifests = new Set(['/w/a/package.json', '/w/a-b/package.json']);
  const { errors } = dropDuplicateProjects(projects, manifests);
  const files = errors.map((error) => error.file);

  assert.deepEqual(files, ['/w/a/package.json']);
});
