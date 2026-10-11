import { basename, join, relative, sep } from 'node:path';

import {
  recordField,
  stringArrayField,
  stringField
} from './manifest-fields.util.ts';
import { readTrackedRecord } from './tracked-read.util.ts';

import type {
  ConfigError,
  DiscoveredRoot,
  JsonObject,
  Project,
  ProjectRead,
  ReadSet
} from '../common/modular-boundaries.type.ts';

type Manifests = {
  readonly projectJson: JsonObject;
  readonly packageJson: JsonObject;
  readonly turboJson: JsonObject;
  readonly moonYml: JsonObject;
};

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

const readManifests = (
  root: string,
  readSet: ReadSet,
  errors: ConfigError[]
): Manifests => {
  const read = (name: string): JsonObject => {
    const path = join(root, name);

    return readTrackedRecord(readSet, path, errors);
  };
  const manifests: Manifests = {
    projectJson: read('project.json'),
    packageJson: read('package.json'),
    turboJson: read('turbo.json'),
    moonYml: read('moon.yml')
  };

  return manifests;
};

const moonId = (discovered: DiscoveredRoot, moonYml: JsonObject): string => {
  const ymlId = stringField(moonYml, 'id');

  return discovered.moonId ?? ymlId ?? basename(discovered.root);
};

const projectId = (
  workspaceRoot: string,
  discovered: DiscoveredRoot,
  manifests: Manifests
): string => {
  const { projectJson, packageJson, moonYml } = manifests;
  const projectName = stringField(projectJson, 'name');
  const nx = recordField(packageJson, 'nx');
  const nxName = stringField(nx, 'name');

  if (projectName !== undefined) return projectName;
  if (nxName !== undefined) return nxName;

  const isMoonProject =
    moonYml !== undefined || discovered.moonId !== undefined;

  if (isMoonProject) return moonId(discovered, moonYml);

  const packageName = stringField(packageJson, 'name');

  if (packageName !== undefined) return packageName;

  const path = relative(workspaceRoot, discovered.root);

  return path.split(sep).join('/');
};

const npmTags = (packageJson: JsonObject): string[] => {
  if (packageJson === undefined) return [];

  const isPrivate = packageJson['private'] === true;
  const visibility = isPrivate ? 'npm:private' : 'npm:public';
  const keywords = stringArrayField(packageJson, 'keywords');
  const keywordTags = keywords.map((keyword) => `npm:${keyword}`);

  return [visibility, ...keywordTags];
};

const projectTags = (manifests: Manifests): string[] => {
  const { projectJson, packageJson, turboJson, moonYml } = manifests;
  const nx = recordField(packageJson, 'nx');
  const sources = [
    stringArrayField(projectJson, 'tags'),
    stringArrayField(nx, 'tags'),
    stringArrayField(packageJson, 'tags'),
    npmTags(packageJson),
    stringArrayField(turboJson, 'tags'),
    stringArrayField(moonYml, 'tags')
  ];
  const tags = new Set(sources.flat());

  return [...tags];
};

const dependencyNames = (packageJson: JsonObject): string[] => {
  const dependencyKeys = (key: string): string[] => {
    const dependencies = recordField(packageJson, key) ?? {};

    return Object.keys(dependencies);
  };
  const names = DEPENDENCY_FIELDS.flatMap(dependencyKeys);
  const unique = new Set(names);

  return [...unique];
};

const declaredDependencies = (
  workspaceRoot: string,
  packageJson: JsonObject,
  readSet: ReadSet
): string[] => {
  if (packageJson !== undefined) return dependencyNames(packageJson);

  const rootPath = join(workspaceRoot, 'package.json');
  const rootPackageJson = readTrackedRecord(readSet, rootPath, []);

  return dependencyNames(rootPackageJson);
};

/**
 * Reads one project's manifests. A malformed manifest adds a `ConfigError` and is
 * read as absent; the root is no project when no manifest parsed and no moon id names it.
 */
export const readProject = (
  workspaceRoot: string,
  discovered: DiscoveredRoot,
  readSet: ReadSet
): ProjectRead => {
  const errors: ConfigError[] = [];
  const manifests = readManifests(discovered.root, readSet, errors);
  const parsed = Object.values(manifests).filter((data) => data !== undefined);
  const hasProject = parsed.length > 0 || discovered.moonId !== undefined;

  if (!hasProject) {
    const noProject: ProjectRead = { errors };

    return noProject;
  }

  const { packageJson } = manifests;
  const id = projectId(workspaceRoot, discovered, manifests);
  const packageName = stringField(packageJson, 'name');
  const tags = projectTags(manifests);
  const dependencies = declaredDependencies(
    workspaceRoot,
    packageJson,
    readSet
  );
  const project: Project = {
    id,
    root: discovered.root,
    tags,
    declaredDependencies: dependencies,
    hasOwnPackageJson: packageJson !== undefined
  };

  if (packageName !== undefined) project.packageName = packageName;

  const read: ProjectRead = { project, errors };

  return read;
};
