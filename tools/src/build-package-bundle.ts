import { build } from 'esbuild';
import type { BuildOptions, OnLoadResult, Plugin } from 'esbuild';
import { resolve } from 'node:path';

import type {
  BuildPackageContext,
  PackageDependencyMap
} from './common/build-package.type.ts';

const privatePackageName = '@lint-suite/rule-internals';

const owningPackageMetadataPlugin = (context: BuildPackageContext): Plugin => {
  const manifestPath = resolve(context.packageRoot, 'package.json');
  const contents = JSON.stringify({
    name: context.manifest.name,
    version: context.manifest.version
  });
  const plugin: Plugin = {
    name: 'owning-package-metadata',
    setup: (buildContext): void => {
      buildContext.onLoad(
        { filter: /package\.json$/ },
        (argument): OnLoadResult | undefined => {
          if (argument.path !== manifestPath) return undefined;

          const result: OnLoadResult = { contents, loader: 'json' };

          return result;
        }
      );
    }
  };

  return plugin;
};

const externalDependencies = (context: BuildPackageContext): string[] => {
  const dependencies: PackageDependencyMap = {
    ...(context.manifest.dependencies ?? {}),
    ...(context.manifest.peerDependencies ?? {})
  };
  const packageNames = Object.keys(dependencies);

  return packageNames.filter((name): boolean => name !== privatePackageName);
};

export const bundlePackage = async (
  context: BuildPackageContext
): Promise<void> => {
  const external = externalDependencies(context);
  const plugins = [owningPackageMetadataPlugin(context)];
  const define = {
    __LINT_SUITE_PACKAGE_NAME__: JSON.stringify(context.manifest.name),
    __LINT_SUITE_PACKAGE_VERSION__: JSON.stringify(context.manifest.version)
  };
  const options: BuildOptions = {
    bundle: true,
    conditions: ['development'],
    define,
    entryPoints: context.entryPoints,
    external,
    format: 'esm',
    outdir: context.outputRoot,
    platform: 'node',
    plugins,
    target: 'node24'
  };

  await build(options);
};
