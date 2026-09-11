export type PackageDependencyMap = Record<string, string>;

export type PackageExportConditions = {
  readonly default?: string;
  readonly development?: string;
  readonly types?: string;
};

export type PackageExport = PackageExportConditions | string;

export type PackageExportMap = Record<string, PackageExport>;

export type PackageManifest = {
  readonly dependencies?: PackageDependencyMap;
  readonly devDependencies?: PackageDependencyMap;
  readonly exports?: PackageExportMap;
  readonly files?: string[];
  readonly name: string;
  readonly nx?: unknown;
  readonly optionalDependencies?: PackageDependencyMap;
  readonly peerDependencies?: PackageDependencyMap;
  readonly private?: boolean;
  readonly scripts?: PackageDependencyMap;
  readonly version: string;
  readonly [field: string]: unknown;
};

export type PackageRootsByName = Record<string, string>;

export type BuildPackageContext = {
  readonly entryPoints: string[];
  readonly isUmbrella: boolean;
  readonly manifest: PackageManifest;
  readonly outputRoot: string;
  readonly packageRoot: string;
  readonly privateRoot: string;
  readonly publicPackageRoots: PackageRootsByName;
  readonly sourceRoot: string;
  readonly workspaceRoot: string;
};
