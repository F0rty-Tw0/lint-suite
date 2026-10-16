import type { OxlintConfig } from 'oxlint';

export type RootRecordPicker<Value> = (
  config: OxlintConfig
) => Readonly<Record<string, Value>> | undefined;
