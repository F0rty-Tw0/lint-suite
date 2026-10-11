import { dirname, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { STALE_AFTER_MS } from './common/modular-boundaries.const.ts';
import { readPathAliases } from './utils/path-aliases.util.ts';
import { readTracked, readTrackedData } from './utils/tracked-read.util.ts';
import { listWorkspaceFiles } from './utils/workspace-listing.util.ts';
import {
  packageNameIndex,
  projectRootIndex,
  readWorkspaceProjects
} from './utils/workspace-projects.util.ts';
import { findWorkspaceRoot } from './utils/workspace-root.util.ts';

import type {
  ConfigError,
  Project,
  ReadSet,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';

const models = new Map<string, WorkspaceModel>();

const uniqueErrors = (errors: ConfigError[]): ConfigError[] => {
  const byKey = new Map<string, ConfigError>();

  for (const error of errors) {
    const key = `${error.file}\0${error.message}`;

    byKey.set(key, error);
  }

  return [...byKey.values()];
};

/**
 * Reads the workspace at `root`: listing, projects (duplicate ids and package
 * names dropped), root tsconfig path aliases, root `turbo.json` and
 * `.moon/workspace.yml` data, and every config error, deduped by file and message.
 */
export const buildWorkspaceModel = (root: string): WorkspaceModel => {
  const base = resolve(root);
  const readSet: ReadSet = new Map();
  const errors: ConfigError[] = [];
  const listing = listWorkspaceFiles(base, readSet);
  const projects = readWorkspaceProjects(base, listing, readSet, errors);
  const pathAliases = readPathAliases(base, readSet, errors);
  const turboPath = join(base, 'turbo.json');
  const rootTurbo = readTrackedData(readSet, turboPath, errors);
  const moonPath = join(base, '.moon', 'workspace.yml');
  const moonWorkspace = readTrackedData(readSet, moonPath, errors);
  const projectByRoot = projectRootIndex(projects);
  const projectByPackageName = packageNameIndex(projects);
  const configErrors = uniqueErrors(errors);
  const lastValidatedAt = Date.now();
  const model: WorkspaceModel = {
    root: base,
    projects,
    projectByRoot,
    projectByPackageName,
    pathAliases,
    rootTurbo,
    moonWorkspace,
    listing,
    errors: configErrors,
    readSet,
    lastValidatedAt
  };

  return model;
};

/**
 * Rebuilds the model when the manifest or package `turbo.json` list changed or
 * any read-set file now reads to a different value reference; otherwise
 * refreshes `listing` and `lastValidatedAt` on the same model object.
 */
export const validateModel = (model: WorkspaceModel): WorkspaceModel => {
  const scratch: ReadSet = new Map();
  const listing = listWorkspaceFiles(model.root, scratch);
  const { manifests, packageTurboFiles } = model.listing;
  const isSameManifests = isDeepStrictEqual(listing.manifests, manifests);
  const isSameTurbo = isDeepStrictEqual(
    listing.packageTurboFiles,
    packageTurboFiles
  );
  const readEntries = [...model.readSet];
  const isChangedRead = ([path, value]: [string, unknown]): boolean => {
    return readTracked(scratch, path) !== value;
  };
  const isChanged =
    !isSameManifests || !isSameTurbo || readEntries.some(isChangedRead);

  if (isChanged) return buildWorkspaceModel(model.root);

  model.listing = listing;
  model.lastValidatedAt = Date.now();

  return model;
};

/**
 * The model for the workspace holding `filename`: `workspaceRootOption`
 * (resolved against the cwd) or the nearest marked ancestor. Cached by root and
 * revalidated once `STALE_AFTER_MS` has passed.
 */
export const workspaceModelFor = (
  filename: string,
  workspaceRootOption?: string
): WorkspaceModel | undefined => {
  const directory = dirname(filename);
  const root =
    workspaceRootOption === undefined
      ? findWorkspaceRoot(directory, new Map())
      : resolve(workspaceRootOption);

  if (root === undefined) return undefined;

  const cached = models.get(root);

  if (cached === undefined) {
    const built = buildWorkspaceModel(root);

    models.set(root, built);

    return built;
  }

  const isFresh = Date.now() - cached.lastValidatedAt <= STALE_AFTER_MS;

  if (isFresh) return cached;

  const validated = validateModel(cached);

  models.set(root, validated);

  return validated;
};

const projectAt = (
  model: WorkspaceModel,
  directory: string
): Project | undefined => {
  const project = model.projectByRoot.get(directory);

  if (project !== undefined) return project;

  const parent = dirname(directory);

  if (parent === directory) return undefined;

  return projectAt(model, parent);
};

/** The project with the longest root containing `path` (a file or directory). */
export const projectForFile = (
  model: WorkspaceModel,
  path: string
): Project | undefined => {
  return projectAt(model, resolve(path));
};
