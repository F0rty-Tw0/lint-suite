export type OxlintRun = {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type OxlintDiagnostic = {
  readonly code: string;
  readonly filename: string;
  readonly message: string;
};

export type SmokeTrigger = {
  readonly rule: string;
  readonly file: string;
};

export type PrintedConfig = {
  readonly plugins: string[];
  readonly rules: Readonly<Record<string, unknown>>;
};
