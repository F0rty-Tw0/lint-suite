export type PackageConsumer = {
  readonly directory: string;
  readonly dispose: () => Promise<void>;
};

type PackedPackage = {
  readonly archive: string;
  readonly name: string;
};

export type PackedPackageMap = Record<string, PackedPackage>;
