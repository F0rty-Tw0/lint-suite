import { isRecord } from './record.spec.util.ts';
import type { OxlintDiagnostic, SmokeTrigger } from '../common/smoke.type.ts';

const textOf = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];

  if (typeof value !== 'string') return '';

  return value.replaceAll('\\', '/');
};

const toDiagnostic = (value: unknown): OxlintDiagnostic => {
  if (!isRecord(value)) throw new Error('oxlint diagnostic is not an object');

  const code = textOf(value, 'code');
  const filename = textOf(value, 'filename');
  const message = textOf(value, 'message');
  const diagnostic: OxlintDiagnostic = { code, filename, message };

  return diagnostic;
};

export const parseDiagnostics = (stdout: string): OxlintDiagnostic[] => {
  const report: unknown = JSON.parse(stdout);

  if (!isRecord(report)) throw new Error('oxlint report is not an object');

  const { diagnostics } = report;

  if (!Array.isArray(diagnostics)) {
    throw new Error('oxlint report has no diagnostics list');
  }

  return diagnostics.map(toDiagnostic);
};

export const toDiagnosticCode = (rule: string): string => {
  const separator = rule.lastIndexOf('/');
  const plugin = rule.slice(0, separator);
  const name = rule.slice(separator + 1);

  return `${plugin}(${name})`;
};

export const isReported = (
  diagnostics: OxlintDiagnostic[],
  trigger: SmokeTrigger
): boolean => {
  const code = toDiagnosticCode(trigger.rule);
  const isTrigger = (diagnostic: OxlintDiagnostic): boolean => {
    const isCode = diagnostic.code === code;
    const isFile = diagnostic.filename === trigger.file;

    return isCode && isFile;
  };

  return diagnostics.some(isTrigger);
};
