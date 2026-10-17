import {
  ESLINT_JS_RULES,
  TS_EXTENSION_RULES
} from '../common/rule-name.const.ts';
import type { Severity } from '../common/rule-name.type.ts';

const TS_PREFIX = '@typescript-eslint/';
const IMPORT_PREFIX = 'import-x/';
const OXLINT_ESLINT_PREFIX = 'eslint/';
const OXLINT_ESLINT_JS_PREFIX = 'eslint-js/';
const OXLINT_TS_PREFIX = 'typescript/';
const OXLINT_IMPORT_PREFIX = 'import/';

const ERROR_VALUES: unknown[] = [2, 'error', 'deny'];
const WARN_VALUES: unknown[] = [1, 'warn'];

const replacePrefix = (
  name: string,
  prefix: string,
  replacement: string
): string => {
  const rest = name.slice(prefix.length);

  return `${replacement}${rest}`;
};

const toEslintBaseName = (name: string): string => {
  const isEslintJs = name.startsWith(OXLINT_ESLINT_JS_PREFIX);

  if (isEslintJs) return name.slice(OXLINT_ESLINT_JS_PREFIX.length);

  const isImport = name.startsWith(OXLINT_IMPORT_PREFIX);

  if (isImport) return replacePrefix(name, OXLINT_IMPORT_PREFIX, IMPORT_PREFIX);

  const isTypescript = name.startsWith(OXLINT_TS_PREFIX);

  if (isTypescript) return replacePrefix(name, OXLINT_TS_PREFIX, TS_PREFIX);

  const isCore = name.startsWith(OXLINT_ESLINT_PREFIX);

  if (isCore) return name.slice(OXLINT_ESLINT_PREFIX.length);

  return name;
};

const severityValue = (entry: unknown): unknown => {
  if (!Array.isArray(entry)) return entry;

  const items: unknown[] = entry;
  const [value] = items;

  return value;
};

export const toOxlintRuleName = (name: string): string => {
  const isImport = name.startsWith(IMPORT_PREFIX);

  if (isImport) return replacePrefix(name, IMPORT_PREFIX, OXLINT_IMPORT_PREFIX);

  const isTypescript = name.startsWith(TS_PREFIX);

  if (isTypescript) {
    const tsRule = name.slice(TS_PREFIX.length);
    const isExtension = TS_EXTENSION_RULES.includes(tsRule);
    const prefix = isExtension ? OXLINT_ESLINT_PREFIX : OXLINT_TS_PREFIX;

    return `${prefix}${tsRule}`;
  }

  const isPrefixed = name.includes('/');

  if (isPrefixed) return name;

  const isEslintJs = ESLINT_JS_RULES.includes(name);
  const prefix = isEslintJs ? OXLINT_ESLINT_JS_PREFIX : OXLINT_ESLINT_PREFIX;

  return `${prefix}${name}`;
};

export const toEslintRuleNames = (name: string): string[] => {
  const baseName = toEslintBaseName(name);
  const isCore = name.startsWith(OXLINT_ESLINT_PREFIX);
  const isExtension = TS_EXTENSION_RULES.includes(baseName);
  const names = [baseName];

  if (isCore && isExtension) {
    names.push(`${TS_PREFIX}${baseName}`);
  }

  return names;
};

export const normalizeSeverity = (entry: unknown): Severity => {
  const value = severityValue(entry);
  const isError = ERROR_VALUES.includes(value);

  if (isError) return 'error';

  const isWarn = WARN_VALUES.includes(value);

  if (isWarn) return 'warn';

  return 'off';
};

export const isEnabled = (entry: unknown): boolean => {
  const severity = normalizeSeverity(entry);

  return severity !== 'off';
};
