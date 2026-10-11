export type FixtureWorkspace = {
  readonly directory: string;
  readonly file: (path: string) => string;
  readonly dispose: () => void;
};
