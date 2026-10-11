import { basename, extname } from 'node:path';

import {
  flattenDiagnosticMessageText,
  parseConfigFileTextToJson
} from 'typescript';
import { parse } from 'yaml';

import type { Parser, ParseResult } from '../common/modular-boundaries.type.ts';

const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const LEADING_BOM = /^\uFEFF/u;

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  return String(error);
};

const failure = (message: string): ParseResult<never> => {
  const result: ParseResult<never> = { ok: false, message };

  return result;
};

const success = <T>(data: T): ParseResult<T> => {
  const result: ParseResult<T> = { ok: true, data };

  return result;
};

export const parseJson: Parser<unknown> = (text) => {
  const json = text.replace(LEADING_BOM, '');

  try {
    const data: unknown = JSON.parse(json);

    return success(data);
  } catch (error) {
    const message = errorMessage(error);

    return failure(message);
  }
};

export const parseJsonc: Parser<unknown> = (text, path) => {
  const parsed = parseConfigFileTextToJson(path, text);

  if (parsed.error) {
    const messageText = parsed.error.messageText;
    const message = flattenDiagnosticMessageText(messageText, '\n');

    return failure(message);
  }

  const data: unknown = parsed.config;

  return success(data);
};

export const parseYaml: Parser<unknown> = (text) => {
  try {
    const data: unknown = parse(text);

    return success(data);
  } catch (error) {
    const message = errorMessage(error);

    return failure(message);
  }
};

const isContentLine = (line: string): boolean => {
  return line !== '' && !line.startsWith('#');
};

export const parseLines: Parser<string[]> = (text) => {
  const lines = text.split(/\r?\n/u).map((line) => line.trim());
  const data = lines.filter(isContentLine);

  return success(data);
};

export const parserFor = (path: string): Parser<unknown> => {
  const name = basename(path);
  const extension = extname(name);

  if (name === 'package.json') return parseJson;
  if (name === '.nxignore') return parseLines;

  const isYaml = YAML_EXTENSIONS.has(extension);

  if (isYaml) return parseYaml;

  return parseJsonc;
};
