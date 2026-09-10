export type CachedFile<T> = {
  readonly value: T;
  readonly version: string;
};

export type FileCacheIdentity = {
  readonly packageName: string;
  readonly packageVersion: string;
};

export type FileCache<T> = {
  readonly name: string;
  readonly identity: FileCacheIdentity;
  readonly entries: Map<string, CachedFile<T>>;
  // Flipped once the disk copy has been read.
  loaded: boolean;
  // Flipped when an entry is parsed in this process.
  dirty: boolean;
};
