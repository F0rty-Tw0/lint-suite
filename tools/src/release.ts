import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { readJsonFile } from '@nx/devkit';
import type { NxJsonConfiguration } from '@nx/devkit';

import type { ReleaseBump } from './common/release.type.ts';
import { publishReleaseNotes } from './release-notes.ts';
import { prepareRelease } from './release-prepare.ts';

const require = createRequire(import.meta.url);
const nxBin = require.resolve('nx/bin/nx');

const git = (...args: string[]): string => {
  const output = execFileSync('git', args, { encoding: 'utf8' });

  return output.trim();
};

const tagCommit = (tag: string): string | undefined => {
  const existing = git('tag', '--list', tag);

  if (!existing) return undefined;

  return git('rev-parse', `refs/tags/${tag}^{commit}`);
};

const publicProjects = (): string[] => {
  const configuration = readJsonFile<NxJsonConfiguration>('nx.json');
  const projects = configuration.release?.projects;

  if (!Array.isArray(projects)) {
    throw new Error('Configure the public release projects in nx.json.');
  }

  return projects;
};

const currentProjects = (): string[] => {
  const current = tagCommit('release/current');
  const successful = tagCommit('release/success');
  const head = git('rev-parse', 'HEAD');

  if (!current || current !== head) {
    throw new Error(
      'Check out release/current before retrying its publication.'
    );
  }

  if (current === successful)
    throw new Error('The current release is already complete.');

  const tags = git('tag', '--points-at', head).split('\n');
  const belongsToRelease = (project: string): boolean => {
    const prefix = `${project}@`;

    return tags.some((tag: string): boolean => tag.startsWith(prefix));
  };
  const projects = publicProjects().filter(belongsToRelease);

  if (projects.length === 0)
    throw new Error('No package tags exist at release/current.');

  return projects.sort();
};

const affectedProjects = (base: string | undefined): string[] => {
  const projects = publicProjects();

  if (!base) return projects;

  git('merge-base', '--is-ancestor', base, 'HEAD');

  const args = [
    nxBin,
    'show',
    'projects',
    '--affected',
    `--base=${base}`,
    '--head=HEAD',
    `--projects=${projects.join(',')}`,
    '--withTarget=nx-release-publish',
    '--json'
  ];
  const output = execFileSync(process.execPath, args, { encoding: 'utf8' });
  const selected: unknown = JSON.parse(output);
  const isProjectList = (value: unknown): value is string[] => {
    if (!Array.isArray(value)) return false;

    return value.every((name: unknown): boolean => typeof name === 'string');
  };

  if (!isProjectList(selected))
    throw new Error('Nx returned an invalid project list.');

  return selected.sort();
};

const readBump = (value: string | undefined): ReleaseBump => {
  if (value === undefined) return 'patch';
  if (value === 'patch' || value === 'minor' || value === 'major') return value;

  throw new Error('Expected patch, minor, or major.');
};

const runPreparation = async (
  command: 'plan' | 'prepare',
  value: string | undefined
): Promise<void> => {
  const bump = readBump(value);
  const current = tagCommit('release/current');
  const successful = tagCommit('release/success');

  if (current && current !== successful) {
    throw new Error(
      'An unfinished release exists. Run the publish-current workflow first.'
    );
  }

  const projects = affectedProjects(successful);

  console.log(
    `Baseline: ${successful ?? 'first release (all public packages)'}`
  );
  console.log(`Affected: ${projects.join(', ') || 'none'}`);

  if (command === 'prepare') {
    const changes = git('status', '--porcelain');

    if (changes)
      throw new Error('Release preparation requires a clean checkout.');
  }

  if (projects.length > 0) {
    await prepareRelease(projects, bump, command === 'plan');
  }

  const output = process.env['GITHUB_OUTPUT'];

  if (command === 'prepare' && output) {
    appendFileSync(output, `projects=${projects.join(',')}\n`);
  }
};

const run = async (): Promise<void> => {
  const rawArgs = process.argv.slice(2);
  const args = rawArgs.filter((argument: string): boolean => argument !== '--');
  const [command, value, ...extra] = args;

  if (extra.length > 0) throw new Error('Too many release arguments.');

  if (command === 'projects' || command === 'notes') {
    if (value) throw new Error(`${command} accepts no arguments.`);

    const projects = currentProjects();

    if (command === 'notes') {
      await publishReleaseNotes(projects);
    } else {
      process.stdout.write(`${projects.join(',')}\n`);
    }

    return;
  }

  if (command !== 'plan' && command !== 'prepare') {
    throw new Error(
      'Usage: node tools/src/release.ts <plan|prepare> [patch|minor|major]'
    );
  }

  await runPreparation(command, value);
};

await run();
