import { cp, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { readJsonFile } from '@nx/devkit';
import { isMap, parseDocument } from 'yaml';
import type { Document } from 'yaml';

import type {
  BuildPackageContext,
  PackageDependencyMap,
  PackageManifest
} from './common/build-package.type.ts';

const materializedDependencies = (
  context: BuildPackageContext,
  dependencies: PackageDependencyMap,
  workspace: Document
): PackageDependencyMap => {
  const materialized: PackageDependencyMap = {};

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (name === '@lint-suite/rule-internals') continue;

    const isCatalog = specifier.startsWith('catalog:');
    const isWorkspace = specifier.startsWith('workspace:');

    if (isCatalog) {
      const catalogName = specifier.slice('catalog:'.length);
      const version: unknown = workspace.getIn(['catalogs', catalogName, name]);

      if (typeof version !== 'string') {
        throw new Error(`Missing catalog value for ${name}: ${specifier}`);
      }

      materialized[name] = version;
    } else if (isWorkspace) {
      const dependencyRoot = context.publicPackageRoots[name];

      if (!dependencyRoot)
        throw new Error(`Private dependency leaked: ${name}`);

      const path = join(dependencyRoot, 'package.json');
      const manifest = readJsonFile<PackageManifest>(path);

      if (manifest.private)
        throw new Error(`Private dependency leaked: ${name}`);

      materialized[name] = manifest.version;
    } else {
      materialized[name] = specifier;
    }
  }

  return materialized;
};

const publishedManifest = (
  context: BuildPackageContext,
  workspace: Document
): PackageManifest => {
  const manifest = { ...context.manifest };
  const fields = [
    'dependencies',
    'peerDependencies',
    'optionalDependencies'
  ] as const;

  delete manifest.devDependencies;
  delete manifest.scripts;
  delete manifest.nx;

  for (const field of fields) {
    const dependencies = manifest[field];

    if (dependencies) {
      manifest[field] = materializedDependencies(
        context,
        dependencies,
        workspace
      );
    }
  }

  if (manifest.exports) {
    const exports = { ...manifest.exports };

    for (const [name, value] of Object.entries(exports)) {
      if (typeof value === 'string') continue;

      const conditions = { ...value };

      delete conditions.development;
      exports[name] = conditions;
    }

    manifest.exports = exports;
  }

  manifest.files = [
    '**/*.js',
    '**/*.d.ts',
    'README.md',
    'LICENSE',
    'CHANGELOG.md'
  ];

  return manifest;
};

export const writePublishedManifest = async (
  context: BuildPackageContext
): Promise<void> => {
  const source = await readFile('pnpm-workspace.yaml', 'utf8');
  const workspace = parseDocument(source);
  const error = workspace.errors[0];

  if (error) throw error;
  if (!isMap(workspace.contents))
    throw new Error('Expected workspace configuration.');

  const manifest = publishedManifest(context, workspace);
  const text = `${JSON.stringify(manifest, null, 2)}\n`;

  await writeFile(resolve(context.outputRoot, 'package.json'), text);

  for (const asset of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
    const sourcePath = resolve(context.packageRoot, asset);
    const targetPath = resolve(context.outputRoot, asset);

    await cp(sourcePath, targetPath);
  }
};
