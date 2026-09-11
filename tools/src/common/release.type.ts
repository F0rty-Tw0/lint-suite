export type ReleaseBump = 'patch' | 'minor' | 'major';

export type ReleaseProject = {
  readonly initial: boolean;
  readonly legacyBaseline: string | undefined;
  readonly name: string;
  readonly version: string;
};
