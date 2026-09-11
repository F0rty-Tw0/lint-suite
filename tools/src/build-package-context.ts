import { createProjectGraphAsync, readJsonFile } from '@nx/devkit';
import type { NxJsonConfiguration } from '@nx/devkit';
import { resolve } from 'node:path';

import type {
  BuildPackageContext,
  PackageManifest,
  PackageRootsByName
} from './common/build-package.type.ts';

const releaseProjectNames = (configuration: NxJsonConfiguration): string[] => {
  const projects = configuration.release?.projects;

  if (!Array.isArray(projects)) {
    throw new Error(
      'Expected nx.json release.projects to list public projects'
    );
  }

  return projects;
};

export const buildPackageContext = async (
  packageRoot: string
): Promise<BuildPackageContext> => {
  const configuration = readJsonFile<NxJsonConfiguration>('nx.json');
  const projectNames = releaseProjectNames(configuration);
  const projectGraph = await createProjectGraphAsync();
  const requestedRoot = resolve(packageRoot);
  const publicPackageRoots: PackageRootsByName = {};
  let manifest: PackageManifest | undefined;

  for (const projectName of projectNames) {
    const project = projectGraph.nodes[projectName];

    if (!project) {
      throw new Error(
        `Public release project is missing from Nx: ${projectName}`
      );
    }

    const packageManifestPath = resolve(project.data.root, 'package.json');
    const packageManifest = readJsonFile<PackageManifest>(packageManifestPath);

    if (packageManifest.private) {
      throw new Error(`Public release project is private: ${projectName}`);
    }

    publicPackageRoots[packageManifest.name] = project.data.root;

    if (resolve(project.data.root) === requestedRoot) {
      manifest = packageManifest;
      packageRoot = project.data.root;
    }
  }

  if (!manifest) {
    throw new Error(`Not a public package root: ${packageRoot}`);
  }

  const isUmbrella = manifest.name === 'lint-suite';
  const entryNames = isUmbrella
    ? ['eslint', 'stylelint', 'prettier']
    : ['index'];
  const sourceRoot = resolve(packageRoot, 'src');
  const entryPoints = entryNames.map((entryName): string =>
    resolve(sourceRoot, `${entryName}.ts`)
  );
  const context: BuildPackageContext = {
    entryPoints,
    isUmbrella,
    manifest,
    outputRoot: resolve('dist', packageRoot),
    packageRoot,
    privateRoot: resolve('shared/rule-internals/src'),
    publicPackageRoots,
    sourceRoot,
    workspaceRoot: process.cwd()
  };

  return context;
};
