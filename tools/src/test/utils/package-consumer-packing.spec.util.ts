import { execFileSync } from 'node:child_process';
import type { ExecFileSyncOptionsWithStringEncoding } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

import { createProjectGraphAsync, readJsonFile } from '@nx/devkit';
import type { NxJsonConfiguration } from '@nx/devkit';

import type { PackageManifest } from '../../common/build-package.type.ts';
import type { PackedPackageMap } from '../common/package-consumer.type.ts';

const requireHost = createRequire(
  new URL('../../../../packages/lint-suite/package.json', import.meta.url)
);

export const runPnpm = (cwd: string, pnpmArguments: string[]): string => {
  const options: ExecFileSyncOptionsWithStringEncoding = {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 180_000
  };

  if (process.platform !== 'win32') {
    return execFileSync('pnpm', pnpmArguments, options);
  }

  const commandArguments = pnpmArguments.map(
    (argument): string => `"${argument}"`
  );
  const command = ['pnpm', ...commandArguments].join(' ');
  const windowsOptions = {
    ...options,
    windowsVerbatimArguments: true
  };

  return execFileSync(
    process.env['ComSpec'] ?? 'cmd.exe',
    ['/d', '/s', '/c', command],
    windowsOptions
  );
};

const hostVersion = (name: string): string => {
  const manifestPath = requireHost.resolve(`${name}/package.json`);
  const manifest = readJsonFile<PackageManifest>(manifestPath);

  return manifest.version;
};

const releaseProjectNames = (): string[] => {
  const configuration = readJsonFile<NxJsonConfiguration>('nx.json');
  const projects = configuration.release?.projects;

  if (!Array.isArray(projects)) {
    throw new Error(
      'Expected nx.json release.projects to list public projects'
    );
  }

  return projects;
};

export const packedPublicPackages = async (
  packs: string
): Promise<PackedPackageMap> => {
  const projectGraph = await createProjectGraphAsync();
  const packages: PackedPackageMap = {};

  for (const projectName of releaseProjectNames()) {
    const project = projectGraph.nodes[projectName];

    if (!project) {
      throw new Error(
        `Public release project is missing from Nx: ${projectName}`
      );
    }

    const output = resolve('dist', project.data.root);
    const sourceManifest = readJsonFile<PackageManifest>(
      join(project.data.root, 'package.json')
    );
    const manifest = readJsonFile<PackageManifest>(
      join(output, 'package.json')
    );

    if (manifest.name !== sourceManifest.name) {
      throw new Error(`Packed package name differs from ${projectName}`);
    }
    const before = new Set(await readdir(packs));
    runPnpm(output, ['pack', '--pack-destination', packs]);
    const packed = (await readdir(packs)).find(
      (name): boolean => !before.has(name)
    );

    if (!packed) {
      throw new Error(`Missing packed artifact for ${projectName}`);
    }

    packages[manifest.name] = {
      archive: `file:${join(packs, packed).replaceAll('\\', '/')}`,
      name: manifest.name
    };
  }

  return packages;
};

export const consumerDependencies = (
  packages: PackedPackageMap
): Record<string, string> => {
  const lintSuite = packages['lint-suite'];
  const eslintPlugin =
    packages['@lint-suite/eslint-plugin-no-unstyled-classes'];
  const stylelintPlugin = packages['@lint-suite/stylelint-no-unused-classes'];

  if (!lintSuite || !eslintPlugin || !stylelintPlugin) {
    throw new Error('Expected packed public packages required by the consumer');
  }

  const dependencies: Record<string, string> = {
    '@lint-suite/eslint-plugin-no-unstyled-classes': eslintPlugin.archive,
    '@lint-suite/stylelint-no-unused-classes': stylelintPlugin.archive,
    '@types/node': hostVersion('@types/node'),
    eslint: hostVersion('eslint'),
    'lint-suite': lintSuite.archive,
    prettier: hostVersion('prettier'),
    stylelint: hostVersion('stylelint'),
    typescript: hostVersion('typescript')
  };

  return dependencies;
};
