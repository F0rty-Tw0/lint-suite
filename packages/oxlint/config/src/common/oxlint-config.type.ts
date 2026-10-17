export type ResolvedOxlintConfig = {
  readonly rules: Readonly<Record<string, unknown>>;
  readonly plugins: string[];
  readonly jsPlugins: string[];
  readonly settings: Readonly<Record<string, unknown>>;
  readonly globals: Readonly<Record<string, unknown>>;
};

export type JsPluginEntry = {
  readonly name: string;
  readonly specifier: string;
};
