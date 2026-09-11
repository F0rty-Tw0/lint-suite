import { execFileSync, spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  mkdtempSync,
  rmSync,
  symlinkSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { readJsonFile } from '@nx/devkit';

import type { ReleaseScenario } from '../common/release-scenario.type.ts';

type Manifest = { readonly version: string };

export const createReleaseScenario = (): ReleaseScenario => {
  const repository = resolve(import.meta.dirname, '../../../..');
  const fixture = resolve(import.meta.dirname, '../fixtures/release-workspace');
  const root = mkdtempSync(join(tmpdir(), 'nx-release-scenario-'));
  const nodeModules = join(repository, 'node_modules');
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  const environment = {
    ...process.env,
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
    NX_TUI: 'false',
    NX_SKIP_LOG_GROUPING: 'true',
    CI: 'true',
    GITHUB_OUTPUT: '',
    npm_config_frozen_lockfile: 'false'
  };
  const copyProduction = (source: string): boolean => {
    const testFolder = join(repository, 'tools', 'src', 'test');
    const isTestFolder = source.startsWith(testFolder);
    const isSpec = source.endsWith('.spec.ts');

    return !isTestFolder && !isSpec;
  };

  cpSync(fixture, root, { recursive: true });
  cpSync(join(repository, 'tools'), join(root, 'tools'), {
    recursive: true,
    filter: copyProduction
  });
  symlinkSync(nodeModules, join(root, 'node_modules'), linkType);

  const git = (...args: string[]): string => {
    const output = execFileSync('git', args, { cwd: root, encoding: 'utf8' });

    return output.trim();
  };
  const run = (...args: string[]): SpawnSyncReturns<string> => {
    const command = [join(root, 'tools/src/release.ts'), ...args];

    return spawnSync(process.execPath, command, {
      cwd: root,
      encoding: 'utf8',
      env: environment,
      timeout: 120_000
    });
  };
  const change = (path: string): void => {
    appendFileSync(join(root, path), '\n// changed\n');
    git('add', '.');
    git('commit', '-m', `fix: update ${path}`);
  };
  const version = (project: string): string => {
    const path = join(root, 'packages', project, 'package.json');
    const manifest = readJsonFile<Manifest>(path);

    return manifest.version;
  };
  const complete = (): void => {
    git('tag', '--force', 'release/current');
    git('tag', '--force', 'release/success');
  };
  const dispose = (): void => rmSync(root, { recursive: true, force: true });
  const scenario: ReleaseScenario = {
    root,
    dispose,
    git,
    run,
    change,
    version,
    complete
  };

  git('init', '--initial-branch=master');
  git('config', 'core.autocrlf', 'false');
  git('config', 'user.name', 'Release Scenario');
  git('config', 'user.email', 'release-scenario@example.com');
  git(
    'add',
    'package.json',
    'nx.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'tsconfig.base.json',
    '.gitignore',
    'packages/lint-suite'
  );
  git('commit', '-m', 'feat: existing umbrella');
  git('tag', 'v2.1.0');
  git('add', '.');
  git('commit', '-m', 'feat: new rule packages');

  return scenario;
};
