import {
  Lexer,
  ParseLocation,
  ParseSourceFile,
  ParseSourceSpan,
  Parser,
  R3TargetBinder,
  parseTemplate
} from '@angular/compiler';
import type { ASTWithSource, DirectiveMeta } from '@angular/compiler';

import { readFileSync, statSync } from 'node:fs';

import { collectAngularExpressionReads } from './angular-expression-reads.ts';

type ExternalTemplateCache = {
  readonly reads: Set<string> | null;
  readonly version: string;
};

const externalTemplates = new Map<string, ExternalTemplateCache>();
const parser = new Parser(new Lexer());
const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

export const templateReads = (
  template: string,
  filename: string
): Set<string> | null => {
  try {
    const result = parseTemplate(template, filename);

    if (result.errors?.length) return null;

    return collectAngularExpressionReads(
      result.nodes,
      templateBinder.bind({ template: result.nodes }),
      false
    );
  } catch {
    return null;
  }
};

export const externalTemplateReads = (filename: string): Set<string> | null => {
  try {
    const stats = statSync(filename, { bigint: true });
    const version = `${stats.mtimeNs}:${stats.size}`;
    const cached = externalTemplates.get(filename);

    if (cached?.version === version) return cached.reads;

    const reads = templateReads(readFileSync(filename, 'utf8'), filename);

    externalTemplates.set(filename, { reads, version });

    return reads;
  } catch {
    return null;
  }
};

const parseExpression = (
  expression: string,
  span: ParseSourceSpan,
  action: boolean
): ASTWithSource => {
  if (action) return parser.parseAction(expression, span, 0);

  return parser.parseBinding(expression, span, 0);
};

export const expressionReads = (
  expression: string,
  filename: string,
  action: boolean
): Set<string> | null => {
  try {
    const file = new ParseSourceFile(expression, filename);
    const start = new ParseLocation(file, 0, 0, 0);
    const span = new ParseSourceSpan(start, start.moveBy(expression.length));
    const result = parseExpression(expression, span, action);

    if (result.errors.length > 0) return null;

    return collectAngularExpressionReads([result], undefined, action);
  } catch {
    return null;
  }
};
