import { join, resolve } from 'node:path';

import { isRecord, isStringArray } from './guards.util.ts';
import { readTrackedRecord } from './tracked-read.util.ts';
import {
  globRoots,
  manifestDirectories,
  normalizeEntry,
  toRoot
} from './workspace-globs.util.ts';
import type {
  ConfigError,
  DiscoveredRoot,
  DiscoveredRoots,
  ReadSet,
  WorkspaceListing
} from '../common/modular-boundaries.type.ts';

type WorkspaceGlobs = {
  pnpmGlobs: string[];
  npmGlobs: string[];
  moonProjects: unknown;
};

const ROOT_PROJECT_MANIFESTS = ['project.json', 'moon.yml'];

const npmWorkspaceGlobs = (packageJson: Record<string, unknown>): string[] => {
  const { workspaces } = packageJson;

  if (isStringArray(workspaces)) return workspaces;

  if (!isRecord(workspaces)) return [];

  const { packages } = workspaces;

  if (isStringArray(packages)) return packages;

  return [];
};

const sourceRoots = (
  root: string,
  sources: Record<string, unknown>
): DiscoveredRoot[] => {
  const roots: DiscoveredRoot[] = [];

  for (const [moonId, path] of Object.entries(sources)) {
    if (typeof path !== 'string') continue;

    const entry = normalizeEntry(path);
    const directory = resolve(root, entry);
    const discovered: DiscoveredRoot = { root: directory, moonId };

    roots.push(discovered);
  }

  return roots;
};

const moonRoots = (
  root: string,
  listing: WorkspaceListing,
  projects: unknown
): DiscoveredRoot[] => {
  const moonDirectories = manifestDirectories(listing, 'moon.yml');

  if (isStringArray(projects)) {
    return globRoots(root, moonDirectories, projects);
  }

  if (!isRecord(projects)) return [];

  const { globs, sources } = projects;
  const hasGlobs = isStringArray(globs);
  const hasSources = isRecord(sources);

  if (!hasGlobs && !hasSources) return sourceRoots(root, projects);

  const noGlobs: string[] = [];
  const noSources: Record<string, unknown> = {};
  const globEntries = hasGlobs ? globs : noGlobs;
  const sourceEntries = hasSources ? sources : noSources;
  const globbed = globRoots(root, moonDirectories, globEntries);
  const sourced = sourceRoots(root, sourceEntries);

  return [...globbed, ...sourced];
};

const readWorkspaceGlobs = (
  root: string,
  readSet: ReadSet,
  errors: ConfigError[]
): WorkspaceGlobs => {
  const pnpmPath = join(root, 'pnpm-workspace.yaml');
  const packagePath = join(root, 'package.json');
  const moonPath = join(root, '.moon', 'workspace.yml');
  const pnpm = readTrackedRecord(readSet, pnpmPath, errors) ?? {};
  const packageJson = readTrackedRecord(readSet, packagePath, errors) ?? {};
  const moon = readTrackedRecord(readSet, moonPath, errors) ?? {};
  const { packages } = pnpm;
  const noPackages: string[] = [];
  const pnpmGlobs = isStringArray(packages) ? packages : noPackages;
  const npmGlobs = npmWorkspaceGlobs(packageJson);
  const globs: WorkspaceGlobs = {
    pnpmGlobs,
    npmGlobs,
    moonProjects: moon['projects']
  };

  return globs;
};

const mergeRoots = (roots: DiscoveredRoot[]): DiscoveredRoot[] => {
  const byRoot = new Map<string, DiscoveredRoot>();

  for (const discovered of roots) {
    const known = byRoot.get(discovered.root);
    const merged: DiscoveredRoot = { ...known, ...discovered };

    byRoot.set(discovered.root, merged);
  }

  const mergedValues = byRoot.values();
  const merged = [...mergedValues];

  return merged.toSorted((a, b) => (a.root < b.root ? -1 : 1));
};

const isRootProject = (root: string, listing: WorkspaceListing): boolean => {
  const manifests = ROOT_PROJECT_MANIFESTS.map((name) => join(root, name));

  return manifests.some((file) => listing.manifests.includes(file));
};

/**
 * Project roots: `package.json` directories matched by `pnpm-workspace.yaml` or
 * `package.json` `workspaces` globs, every `project.json` directory, and moon
 * `projects` (glob list, id → path map, or `{ globs, sources }`). The workspace
 * root counts only when it holds a `project.json` or `moon.yml`.
 */
export const discoverProjectRoots = (
  root: string,
  listing: WorkspaceListing,
  readSet: ReadSet
): DiscoveredRoots => {
  const base = resolve(root);
  const errors: ConfigError[] = [];
  const { pnpmGlobs, npmGlobs, moonProjects } = readWorkspaceGlobs(
    base,
    readSet,
    errors
  );
  const packageDirectories = manifestDirectories(listing, 'package.json');
  const projectDirectories = manifestDirectories(listing, 'project.json');
  const pnpmRoots = globRoots(base, packageDirectories, pnpmGlobs);
  const npmRoots = globRoots(base, packageDirectories, npmGlobs);
  const projectJsonRoots = projectDirectories.map(toRoot);
  const moonProjectRoots = moonRoots(base, listing, moonProjects);
  const hasRootProject = isRootProject(base, listing);
  const isKept = (discovered: DiscoveredRoot): boolean => {
    return hasRootProject || discovered.root !== base;
  };
  const merged = mergeRoots([
    ...pnpmRoots,
    ...npmRoots,
    ...projectJsonRoots,
    ...moonProjectRoots
  ]);
  const roots = merged.filter(isKept);
  const result: DiscoveredRoots = { roots, errors };

  return result;
};
