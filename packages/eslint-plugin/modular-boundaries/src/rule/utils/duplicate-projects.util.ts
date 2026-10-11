import { join, relative, sep } from 'node:path';

import { MANIFEST_NAMES } from '../common/modular-boundaries.const.ts';

import type {
  CheckedProjects,
  ConfigError,
  Project
} from '../common/modular-boundaries.type.ts';

type Collision = {
  readonly first: Project;
  readonly second: Project;
  readonly clashes: string[];
};

type ProjectKey = (project: Project) => string | undefined;

const groupBy = (
  projects: Project[],
  key: ProjectKey
): Map<string, Project[]> => {
  const groups = new Map<string, Project[]>();

  for (const project of projects) {
    const value = key(project);

    if (value === undefined) continue;

    const group = groups.get(value) ?? [];

    group.push(project);
    groups.set(value, group);
  }

  return groups;
};

const addCollisions = (
  collisions: Map<string, Collision>,
  group: Project[],
  clash: string
): void => {
  for (const [index, first] of group.entries()) {
    const later = group.slice(index + 1);

    for (const second of later) {
      const pairKey = `${first.root}\0${second.root}`;
      const fresh: Collision = { first, second, clashes: [] };
      const collision = collisions.get(pairKey) ?? fresh;

      collision.clashes.push(clash);
      collisions.set(pairKey, collision);
    }
  }
};

/** `package.json`, else `project.json`, else `moon.yml`, else the root itself. */
const primaryManifest = (project: Project, manifests: Set<string>): string => {
  const files = MANIFEST_NAMES.map((name) => join(project.root, name));
  const manifest = files.find((file) => manifests.has(file));

  return manifest ?? project.root;
};

const collisionError = (
  root: string,
  collision: Collision,
  manifests: Set<string>
): ConfigError => {
  const firstFile = primaryManifest(collision.first, manifests);
  const secondFile = primaryManifest(collision.second, manifests);
  const isFirstLater = firstFile > secondFile;
  const later = isFirstLater ? firstFile : secondFile;
  const earlier = isFirstLater ? secondFile : firstFile;
  const earlierPath = relative(root, earlier).split(sep).join('/');
  const clashes = collision.clashes.join(' and ');
  const error: ConfigError = {
    file: later,
    message: `Duplicate ${clashes} (also in ${earlierPath}).`
  };

  return error;
};

/**
 * Drops every project whose id or package name another project shares, with one
 * `ConfigError` per colliding pair on the later of the pair's primary manifests.
 * The message names the earlier manifest relative to `root`, in POSIX form.
 */
export const dropDuplicateProjects = (
  root: string,
  projects: Project[],
  manifests: Set<string>
): CheckedProjects => {
  const collisions = new Map<string, Collision>();
  const idGroups = groupBy(projects, (project) => project.id);
  const nameGroups = groupBy(projects, (project) => project.packageName);

  for (const [id, group] of idGroups) {
    addCollisions(collisions, group, `project id '${id}'`);
  }

  for (const [name, group] of nameGroups) {
    addCollisions(collisions, group, `package name '${name}'`);
  }

  const colliding = [...collisions.values()];
  const pairProjects = (collision: Collision): Project[] => {
    return [collision.first, collision.second];
  };
  const toError = (collision: Collision): ConfigError => {
    return collisionError(root, collision, manifests);
  };
  const dropped = new Set(colliding.flatMap(pairProjects));
  const kept = projects.filter((project) => !dropped.has(project));
  const errors = colliding.map(toError);
  const checked: CheckedProjects = { projects: kept, errors };

  return checked;
};
