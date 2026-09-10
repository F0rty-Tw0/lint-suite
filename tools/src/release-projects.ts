import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { createProjectGraphAsync, readJsonFile } from '@nx/devkit';

import type { ReleaseProject } from './common/release.type.ts';

type PackageManifest = {
  readonly name: string;
  readonly version: string;
};

const gitOutput = (args: string[]): string | undefined => {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });

  if (result.error) throw result.error;
  if (result.status !== 0) return undefined;

  const output = result.stdout.trim();

  return output || undefined;
};

const isPackageManifest = (value: unknown): value is PackageManifest => {
  if (value === null || typeof value !== 'object') return false;

  const name: unknown = Reflect.get(value, 'name');
  const version: unknown = Reflect.get(value, 'version');

  return typeof name === 'string' && typeof version === 'string';
};

const parsePackageManifest = (
  contents: string
): PackageManifest | undefined => {
  const value: unknown = JSON.parse(contents);
  const isManifest = isPackageManifest(value);

  if (!isManifest) return undefined;

  return value;
};

const legacyBaselineFor = (
  legacyTag: string | undefined,
  projectRoot: string,
  manifest: PackageManifest
): string | undefined => {
  if (!legacyTag) return undefined;

  const contents = gitOutput([
    'show',
    `${legacyTag}:${projectRoot}/package.json`
  ]);

  if (!contents) return undefined;

  const historicalManifest = parsePackageManifest(contents);

  if (historicalManifest?.name !== manifest.name) return undefined;

  return legacyTag;
};

export const readReleaseProjects = async (
  projects: string[]
): Promise<ReleaseProject[]> => {
  const projectGraph = await createProjectGraphAsync();
  const legacyTag = gitOutput([
    'describe',
    '--tags',
    '--match',
    'v*',
    '--abbrev=0'
  ]);
  const releaseProjects: ReleaseProject[] = [];

  for (const name of projects) {
    const project = projectGraph.nodes[name];

    if (!project)
      throw new Error(`Nx project graph does not contain "${name}".`);

    const manifestPath = join(project.data.root, 'package.json');
    const manifest: unknown = readJsonFile(manifestPath);
    const isManifest = isPackageManifest(manifest);

    if (!isManifest)
      throw new Error(`Project "${name}" has no package manifest.`);

    const projectTag = gitOutput(['tag', '--list', `${name}@*`]);
    let legacyBaseline: string | undefined;

    if (!projectTag) {
      legacyBaseline = legacyBaselineFor(
        legacyTag,
        project.data.root,
        manifest
      );
    }

    const initial = projectTag === undefined && legacyBaseline === undefined;
    const releaseProject: ReleaseProject = {
      initial,
      legacyBaseline,
      name,
      version: manifest.version
    };

    releaseProjects.push(releaseProject);
  }

  return releaseProjects;
};
