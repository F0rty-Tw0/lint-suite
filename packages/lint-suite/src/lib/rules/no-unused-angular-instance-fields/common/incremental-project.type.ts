// eslint-disable-next-line local/no-unused-exports -- read by no-unused-angular-instance-fields.incremental.spec.ts
import type { Linter } from 'eslint';

export type IncrementalProject = {
  readonly projectDirectory: string;
  readonly linter: Linter;
  readonly file: (name: string) => string;
  readonly lint: (name: string, code: string) => string[];
  readonly touch: (name: string, content: string) => void;
  readonly dispose: () => void;
};
