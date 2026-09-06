import {
  ASTWithSource,
  TmplAstRecursiveVisitor,
  parseTemplate,
  tmplAstVisitAll
} from '@angular/compiler';
import type {
  AST,
  TmplAstBoundAttribute,
  TmplAstComponent,
  TmplAstElement,
  TmplAstTemplate
} from '@angular/compiler';

import type {
  ClassAttributeHost,
  ClassMatcher
} from '../../common/class-usage.type.ts';
import { createFileCache, readCached } from '../../file-cache.ts';
import { classMatcher } from '../../selector-classes.ts';
import { classExpressionUsage } from '../../utils/class-expression-literals.util.ts';
import { templateClasses } from '../../utils/template-classes.util.ts';
import { toRegExp } from '../../utils/to-regexp.util.ts';
import type {
  TemplateSource,
  TemplateUsage
} from '../common/no-unused-classes.type.ts';

type UsageEntry = {
  readonly names: string[];
  readonly patterns: string[];
  readonly isDynamic: boolean;
};

const CLASS_ATTRIBUTE = 'class';
const NG_CLASS_ATTRIBUTE = 'ngClass';

const matchesNone: ClassMatcher = () => false;

const UNKNOWN_USAGE: TemplateUsage = {
  has: matchesNone,
  isDynamic: true,
  size: 0
};

const templates = createFileCache<UsageEntry | null>('template-usage');

const expressionSource = (value: AST): string | null => {
  const isWithSource = value instanceof ASTWithSource;

  if (!isWithSource) return null;

  return value.source;
};

const isClassInput = (input: TmplAstBoundAttribute): boolean => {
  const isNgClass = input.name === NG_CLASS_ATTRIBUTE;

  if (isNgClass) return true;

  const isClass = input.name === CLASS_ATTRIBUTE;

  if (!isClass) return false;

  const { details } = input.keySpan;

  if (details === null) return true;

  return details === CLASS_ATTRIBUTE;
};

class ClassUsageVisitor extends TmplAstRecursiveVisitor {
  public readonly names = new Set<string>();

  public readonly patterns = new Set<string>();

  public isDynamic = false;

  public override visitElement(element: TmplAstElement): void {
    this.collect(element);
    super.visitElement(element);
  }

  public override visitTemplate(template: TmplAstTemplate): void {
    this.collect(template);
    super.visitTemplate(template);
  }

  public override visitComponent(component: TmplAstComponent): void {
    this.collect(component);
    super.visitComponent(component);
  }

  private collect(node: ClassAttributeHost): void {
    for (const { name } of templateClasses(node)) this.names.add(name);

    for (const input of node.inputs) this.collectInput(input);
  }

  private collectInput(input: TmplAstBoundAttribute): void {
    const isClass = isClassInput(input);

    if (!isClass) return;

    const source = expressionSource(input.value);

    if (source === null) {
      this.isDynamic = true;

      return;
    }

    const usage = classExpressionUsage(source);

    for (const name of usage.names) this.names.add(name);

    for (const pattern of usage.patterns) this.patterns.add(pattern);

    if (usage.isDynamic) this.isDynamic = true;
  }
}

const parseUsage = (text: string, path: string): UsageEntry | null => {
  const parsed = parseTemplate(text, path);

  if (parsed.errors !== null) return null;

  const visitor = new ClassUsageVisitor();

  tmplAstVisitAll(visitor, parsed.nodes);

  const names = [...visitor.names];
  const patterns = [...visitor.patterns];
  const entry: UsageEntry = { names, patterns, isDynamic: visitor.isDynamic };

  return entry;
};

const sourceUsage = (source: TemplateSource): UsageEntry | null => {
  if (source.kind === 'unknown') return null;

  if (source.kind === 'inline') return parseUsage(source.source, source.path);

  return readCached(templates, source.path, parseUsage) ?? null;
};

export const templateUsage = (sources: TemplateSource[]): TemplateUsage => {
  const names = new Set<string>();
  const patterns = new Set<string>();

  for (const source of sources) {
    const entry = sourceUsage(source);

    if (entry === null) return UNKNOWN_USAGE;

    if (entry.isDynamic) return UNKNOWN_USAGE;

    for (const name of entry.names) names.add(name);

    for (const pattern of entry.patterns) patterns.add(pattern);
  }

  const patternList = [...patterns];
  const compiled = patternList.map(toRegExp);
  const has = classMatcher(names, compiled);
  const size = names.size;
  const usage: TemplateUsage = { has, isDynamic: false, size };

  return usage;
};
