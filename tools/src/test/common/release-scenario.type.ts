import type { SpawnSyncReturns } from 'node:child_process';

export type ReleaseScenario = {
  readonly root: string;
  readonly dispose: () => void;
  readonly git: (...args: string[]) => string;
  readonly run: (...args: string[]) => SpawnSyncReturns<string>;
  readonly change: (path: string) => void;
  readonly version: (project: string) => string;
  readonly complete: () => void;
};
