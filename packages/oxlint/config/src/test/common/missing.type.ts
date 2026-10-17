export type TableRow = {
  readonly heading: string;
  readonly rule: string;
  readonly scope: string;
};

export type MissingTable = {
  readonly causes: ReadonlyMap<string, string>;
  readonly deviations: ReadonlySet<string>;
  readonly scopes: ReadonlyMap<string, string>;
  readonly duplicates: ReadonlyMap<string, string[]>;
};
