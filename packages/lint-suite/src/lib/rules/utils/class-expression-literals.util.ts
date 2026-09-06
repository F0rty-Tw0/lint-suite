import {
  Conditional,
  Interpolation,
  Lexer,
  LiteralArray,
  LiteralMap,
  LiteralPrimitive,
  ParseLocation,
  ParseSourceFile,
  ParseSourceSpan,
  Parser
} from '@angular/compiler';
import type { AST, ASTWithSource, LiteralMapKey } from '@angular/compiler';

import type { ClassExpressionUsage } from '../common/class-usage.type.ts';
import { classNamePattern } from '../selector-classes.ts';

const WHITESPACE = /\s+/u;
const EXPRESSION_FILE = 'class-expression';
const INTERPOLATION_TOKEN = 'zzinterpzz';

const parser = new Parser(new Lexer());

const spanOf = (source: string): ParseSourceSpan => {
  const file = new ParseSourceFile(source, EXPRESSION_FILE);
  const start = new ParseLocation(file, 0, 0, 0);
  const span = new ParseSourceSpan(start, start.moveBy(source.length));

  return span;
};

const astOf = (parsed: ASTWithSource): AST | null => {
  const hasErrors = parsed.errors.length > 0;

  if (hasErrors) return null;

  return parsed.ast;
};

const parseClassExpression = (source: string): AST | null => {
  try {
    const span = spanOf(source);
    const interpolation = parser.parseInterpolation(source, span, 0, null);

    if (interpolation) return astOf(interpolation);

    const binding = parser.parseBinding(source, span, 0);

    return astOf(binding);
  } catch {
    return null;
  }
};

const addNames = (value: string, names: string[]): void => {
  for (const token of value.split(WHITESPACE)) {
    if (token) names.push(token);
  }
};

const addPrimitive = (ast: LiteralPrimitive, names: string[]): void => {
  if (typeof ast.value === 'string') addNames(ast.value, names);
};

const addMapKeys = (ast: LiteralMap, names: string[]): void => {
  for (const key of ast.keys) {
    if (key.kind !== 'spread') addNames(key.key, names);
  }
};

const addInterpolation = (ast: Interpolation, names: string[]): void => {
  for (const text of ast.strings) addNames(text, names);
};

const collect = (ast: AST, names: string[]): void => {
  if (ast instanceof LiteralPrimitive) {
    addPrimitive(ast, names);

    return;
  }

  if (ast instanceof LiteralMap) {
    addMapKeys(ast, names);

    return;
  }

  if (ast instanceof Interpolation) {
    addInterpolation(ast, names);

    return;
  }

  if (ast instanceof LiteralArray) {
    for (const expression of ast.expressions) collect(expression, names);

    return;
  }

  if (ast instanceof Conditional) {
    collect(ast.trueExp, names);
    collect(ast.falseExp, names);
  }
};

export const classExpressionLiterals = (source: string): string[] => {
  const ast = parseClassExpression(source);

  if (ast === null) return [];

  const names: string[] = [];

  collect(ast, names);

  const uniqueNames = new Set(names);

  return [...uniqueNames];
};

const isSpreadKey = (key: LiteralMapKey): boolean => key.kind === 'spread';

const isDynamicAst = (ast: AST): boolean => {
  if (ast instanceof LiteralPrimitive) return false;

  if (ast instanceof LiteralMap) return ast.keys.some(isSpreadKey);

  if (ast instanceof LiteralArray) return ast.expressions.some(isDynamicAst);

  if (ast instanceof Conditional) {
    const isTrueDynamic = isDynamicAst(ast.trueExp);
    const isFalseDynamic = isDynamicAst(ast.falseExp);

    return isTrueDynamic || isFalseDynamic;
  }

  return true;
};

const isNamedToken = (token: string): boolean => token !== INTERPOLATION_TOKEN;

const isPatternToken = (token: string): boolean => {
  return token.includes(INTERPOLATION_TOKEN);
};

const isPlainToken = (token: string): boolean => !isPatternToken(token);

const interpolationUsage = (ast: Interpolation): ClassExpressionUsage => {
  const joined = ast.strings.join(INTERPOLATION_TOKEN);
  const tokens = joined.split(WHITESPACE).filter(Boolean);
  const named = tokens.filter(isNamedToken);
  const patterns = named.filter(isPatternToken).map(classNamePattern);
  const names = named.filter(isPlainToken);
  const uniqueNames = new Set(names);
  const uniquePatterns = new Set(patterns);
  const usage: ClassExpressionUsage = {
    names: [...uniqueNames],
    patterns: [...uniquePatterns],
    isDynamic: named.length < tokens.length
  };

  return usage;
};

const UNKNOWN_USAGE: ClassExpressionUsage = {
  names: [],
  patterns: [],
  isDynamic: true
};

export const classExpressionUsage = (source: string): ClassExpressionUsage => {
  const ast = parseClassExpression(source);

  if (ast === null) return UNKNOWN_USAGE;

  if (ast instanceof Interpolation) return interpolationUsage(ast);

  const names: string[] = [];

  collect(ast, names);

  const isDynamic = isDynamicAst(ast);
  const uniqueNames = new Set(names);
  const usage: ClassExpressionUsage = {
    names: [...uniqueNames],
    patterns: [],
    isDynamic
  };

  return usage;
};
