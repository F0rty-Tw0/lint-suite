import { dropDuplicateProjects } from './duplicate-projects.util.ts';
import { discoverProjectRoots } from './project-roots.util.ts';
import { readProject } from './read-project.util.ts';

import type {
  ConfigError,
  DiscoveredRoot,
  Project,
  ProjectRead,
  ReadSet,
  WorkspaceListing
} from '../common/modular-boundaries.type.ts';

/**
 * Discovers and reads every project, then drops duplicate ids and package names.
 * Discovery, manifest and duplicate errors are appended to `errors`.
 */
export const readWorkspaceProjects = (
  root: string,
  listing: WorkspaceListing,
  readSet: ReadSet,
  errors: ConfigError[]
): Project[] => {
  const discovered = discoverProjectRoots(root, listing, readSet);
  const toRead = (entry: DiscoveredRoot): ProjectRead => {
    return readProject(root, entry, readSet);
  };
  const toProjects = (read: ProjectRead): Project[] => {
    return read.project === undefined ? [] : [read.project];
  };
  const reads = discovered.roots.map(toRead);
  const readErrors = reads.flatMap((read) => read.errors);
  const projects = reads.flatMap(toProjects);
  const manifests = new Set(listing.manifests);
  const checked = dropDuplicateProjects(projects, manifests);

  errors.push(...discovered.errors, ...readErrors, ...checked.errors);

  return checked.projects;
};

export const projectRootIndex = (projects: Project[]): Map<string, Project> => {
  const toEntry = (project: Project): [string, Project] => {
    return [project.root, project];
  };
  const entries = projects.map(toEntry);

  return new Map(entries);
};

export const packageNameIndex = (projects: Project[]): Map<string, Project> => {
  const toEntries = (project: Project): [string, Project][] => {
    const { packageName } = project;

    return packageName === undefined ? [] : [[packageName, project]];
  };
  const entries = projects.flatMap(toEntries);

  return new Map(entries);
};
