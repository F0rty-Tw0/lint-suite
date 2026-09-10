import { ReleaseClient } from 'nx/release';

import type { ReleaseBump } from './common/release.type.ts';
import { readReleaseProjects } from './release-projects.ts';

export const prepareRelease = async (
  projects: string[],
  bump: ReleaseBump,
  dryRun: boolean
): Promise<void> => {
  if (projects.length === 0) return;

  const releaseProjects = await readReleaseProjects(projects);
  const initialProjects = releaseProjects.filter(({ initial }) => initial);
  const releasedProjects = releaseProjects.filter(({ initial }) => !initial);
  const initialVersion = initialProjects[0]?.version;
  const mismatchedInitialProject = initialProjects.find(
    ({ version }) => version !== initialVersion
  );
  const legacyBaselines = releaseProjects
    .map(({ legacyBaseline }) => legacyBaseline)
    .filter((baseline): baseline is string => baseline !== undefined);
  const legacyBaseline = legacyBaselines[0];
  const differingLegacyBaseline = legacyBaselines.find(
    (baseline) => baseline !== legacyBaseline
  );

  if (mismatchedInitialProject) {
    throw new Error(
      'Initial release projects must share their on-disk version.'
    );
  }

  if (differingLegacyBaseline) {
    throw new Error(
      'Selected projects have incompatible legacy tag baselines.'
    );
  }

  const versionOptions = {
    deleteVersionPlans: false,
    dryRun,
    gitCommit: false,
    gitPush: false,
    gitTag: false,
    stageChanges: true
  };
  const changelogOptions = {
    createRelease: false as const,
    dryRun,
    firstRelease: false,
    from: legacyBaseline ?? '',
    gitCommit: true,
    gitPush: false,
    gitTag: true,
    projects,
    stageChanges: false
  };
  const initialClient = new ReleaseClient({
    version: { updateDependents: 'never' }
  });
  const releaseClient = new ReleaseClient({});

  if (initialVersion !== undefined) {
    const initialResult = await initialClient.releaseVersion({
      ...versionOptions,
      firstRelease: true,
      projects: initialProjects.map(({ name }) => name),
      specifier: initialVersion
    });

    if (releasedProjects.length === 0) {
      await releaseClient.releaseChangelog({
        ...changelogOptions,
        versionData: initialResult.projectsVersionData
      });

      return;
    }

    const releasedResult = await releaseClient.releaseVersion({
      ...versionOptions,
      firstRelease: false,
      projects: releasedProjects.map(({ name }) => name),
      specifier: bump
    });
    const versionData = {
      ...initialResult.projectsVersionData,
      ...releasedResult.projectsVersionData
    };

    await releaseClient.releaseChangelog({ ...changelogOptions, versionData });

    return;
  }

  const releasedResult = await releaseClient.releaseVersion({
    ...versionOptions,
    firstRelease: false,
    projects: releasedProjects.map(({ name }) => name),
    specifier: bump
  });

  await releaseClient.releaseChangelog({
    ...changelogOptions,
    versionData: releasedResult.projectsVersionData
  });
};
