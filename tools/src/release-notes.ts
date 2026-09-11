import { execFileSync } from 'node:child_process';

import { ReleaseClient } from 'nx/release';

import { readReleaseProjects } from './release-projects.ts';

type ChangelogVersion = {
  readonly currentVersion: string;
  readonly newVersion: string;
  readonly dependentProjects: [];
};

export const publishReleaseNotes = async (
  projects: string[],
  dryRun = false
): Promise<void> => {
  const releases = await readReleaseProjects(projects);
  const versionData: Record<string, ChangelogVersion> = {};

  for (const release of releases) {
    versionData[release.name] = {
      currentVersion: release.version,
      newVersion: release.version,
      dependentProjects: []
    };
  }

  const tag = execFileSync(
    'git',
    ['tag', '--list', 'release/success', '--format=%(objectname)'],
    { encoding: 'utf8' }
  );
  let from = tag.trim();

  if (!from) {
    const roots = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], {
      encoding: 'utf8'
    });

    from = roots.trim().split('\n')[0] ?? '';
  }

  const client = new ReleaseClient({
    changelog: {
      workspaceChangelog: false,
      projectChangelogs: { file: false, createRelease: 'github' }
    }
  });

  await client.releaseChangelog({
    projects,
    versionData,
    from,
    to: 'HEAD',
    dryRun,
    createRelease: 'github',
    forceChangelogGeneration: true,
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    gitPush: false
  });
};
