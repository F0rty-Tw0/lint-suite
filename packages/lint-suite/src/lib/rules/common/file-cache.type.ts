export type CachedFile<T> = {
  readonly value: T;
  readonly version: string;
};

export type FileCache<T> = {
  readonly name: string;
  readonly entries: Map<string, CachedFile<T>>;
  // eslint-disable-next-line local/readonly-type-properties -- flipped once the disk copy was read
  loaded: boolean;
  // eslint-disable-next-line local/readonly-type-properties -- flipped when an entry was parsed this run
  dirty: boolean;
};
