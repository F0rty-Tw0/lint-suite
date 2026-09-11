import { execFileSync } from 'node:child_process';
import type { ExecFileSyncOptionsWithStringEncoding } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { stringify } from 'yaml';

import type { PackageConsumer } from '../common/package-consumer.type.ts';
import {
  allowedBuilds,
  copyConsumerFixtures
} from './package-consumer-fixture.spec.util.ts';
import {
  consumerDependencies,
  packedPublicPackages,
  runPnpm
} from './package-consumer-packing.spec.util.ts';

type ConsumerManifest = {
  readonly dependencies: Record<string, string>;
  readonly name: string;
  readonly packageManager: string;
  readonly private: boolean;
  readonly type: string;
};

type ConsumerWorkspace = {
  readonly allowBuilds: Record<string, boolean>;
  readonly overrides: Record<string, string>;
};

export const createPackageConsumer = async (): Promise<PackageConsumer> => {
  const temporary = await mkdtemp(
    join(tmpdir(), 'lint-suite-package-consumer-')
  );
  const packs = join(temporary, 'packs');
  const directory = join(temporary, 'consumer');

  await mkdir(packs);
  await mkdir(directory);

  const packages = await packedPublicPackages(packs);
  const dependencies = consumerDependencies(packages);
  const manifest: ConsumerManifest = {
    dependencies,
    name: 'packed-consumer-regression',
    packageManager: 'pnpm@11.25.0',
    private: true,
    type: 'module'
  };
  const packedEntries = Object.values(packages);
  const overrides = Object.fromEntries(
    packedEntries.map((packed): [string, string] => [
      packed.name,
      packed.archive
    ])
  );
  const workspace: ConsumerWorkspace = {
    allowBuilds: await allowedBuilds(),
    overrides
  };

  await writeFile(
    join(directory, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  await writeFile(join(directory, 'pnpm-workspace.yaml'), stringify(workspace));
  await copyConsumerFixtures(directory);
  runPnpm(directory, [
    'install',
    '--no-frozen-lockfile',
    '--strict-peer-dependencies'
  ]);

  const consumer: PackageConsumer = {
    directory,
    dispose: async (): Promise<void> =>
      rm(temporary, { force: true, recursive: true })
  };

  return consumer;
};

export const runPackageConsumerSmoke = (consumer: PackageConsumer): string => {
  const options: ExecFileSyncOptionsWithStringEncoding = {
    cwd: consumer.directory,
    encoding: 'utf8',
    env: { ...process.env, LINT_SUITE_CACHE: '0' },
    timeout: 60_000
  };

  return execFileSync(process.execPath, ['smoke.ts'], options);
};

export const typecheckPackageConsumer = (consumer: PackageConsumer): void => {
  const compiler = join(consumer.directory, 'node_modules/typescript/bin/tsc');
  const options: ExecFileSyncOptionsWithStringEncoding = {
    cwd: consumer.directory,
    encoding: 'utf8',
    timeout: 60_000
  };

  execFileSync(
    process.execPath,
    [
      compiler,
      'consumer.ts',
      '--noEmit',
      '--strict',
      '--module',
      'nodenext',
      '--target',
      'es2024'
    ],
    options
  );
};
