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

import { readFileSync } from 'node:fs';

import type {
  ClassAttributeHost,
  ClassMatcher
} from '../../common/class-usage.type.ts';
import { classExpressionUsage } from '../../utils/class-expression-literals.util.ts';
import { classMatcher } from '../../utils/selector-classes.util.ts';
import { templateClasses } from '../../utils/template-classes.util.ts';
import type {
  TemplateSource,
  TemplateUsage
} from '../common/no-unused-classes.type.ts';

type TemplateText = {
  readonly text: string;
  readonly path: string;
};

const CLASS_ATTRIBUTE = 'class';
const NG_CLASS_ATTRIBUTE = 'ngClass';

const matchesNone: ClassMatcher = () => false;

const UNKNOWN_USAGE: TemplateUsage = {
  has: matchesNone,
  isDynamic: true,
  size: 0
};

const toRegExp = (pattern: string): RegExp => new RegExp(pattern, 'u');

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

const templateText = (source: TemplateSource): TemplateText | null => {
  if (source.kind === 'unknown') return null;

  if (source.kind === 'inline') {
    const inline: TemplateText = { text: source.source, path: source.path };

    return inline;
  }

  try {
    const text = readFileSync(source.path, 'utf8');
    const file: TemplateText = { text, path: source.path };

    return file;
  } catch {
    return null;
  }
};

export const templateUsage = (sources: TemplateSource[]): TemplateUsage => {
  const visitor = new ClassUsageVisitor();

  for (const source of sources) {
    const template = templateText(source);

    if (template === null) return UNKNOWN_USAGE;

    const parsed = parseTemplate(template.text, template.path);

    if (parsed.errors !== null) return UNKNOWN_USAGE;

    tmplAstVisitAll(visitor, parsed.nodes);
  }

  if (visitor.isDynamic) return UNKNOWN_USAGE;

  const patterns = [...visitor.patterns].map(toRegExp);
  const has = classMatcher(visitor.names, patterns);
  const size = visitor.names.size;
  const usage: TemplateUsage = { has, isDynamic: false, size };

  return usage;
};
