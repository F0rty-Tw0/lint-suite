import { ParseSourceSpan } from '@angular/compiler';
import type {
  TmplAstBoundAttribute,
  TmplAstTextAttribute
} from '@angular/compiler';

import { classExpressionLiterals } from './class-expression-literals.util.ts';
import type { ClassAttributeHost, TemplateClass } from '../common/class-usage.type.ts';

const CLASS_ATTRIBUTE = 'class';
const CLASS_BINDING_PREFIX = 'class.';
const TOKEN = /\S+/gu;

const expressionSource = (value: object): string | null => {
  if (!('source' in value)) return null;

  const { source } = value;

  if (typeof source !== 'string') return null;

  return source;
};

const staticClasses = (attribute: TmplAstTextAttribute): TemplateClass[] => {
  const classes: TemplateClass[] = [];
  const valueSpan = attribute.valueSpan ?? attribute.sourceSpan;

  for (const token of attribute.value.matchAll(TOKEN)) {
    const start = valueSpan.start.moveBy(token.index);
    const end = valueSpan.start.moveBy(token.index + token[0].length);
    const span = new ParseSourceSpan(start, end);
    const templateClass: TemplateClass = { name: token[0], span };

    classes.push(templateClass);
  }

  return classes;
};

const boundClassName = (input: TmplAstBoundAttribute): string | null => {
  const { details } = input.keySpan;

  if (details === null) return null;

  const isClassBinding = details.startsWith(CLASS_BINDING_PREFIX);

  if (!isClassBinding) return null;

  return input.name;
};

const isClassExpression = (input: TmplAstBoundAttribute): boolean => {
  const isClassName = input.name === CLASS_ATTRIBUTE;

  if (!isClassName) return false;

  const { details } = input.keySpan;

  if (details === null) return true;

  return details === CLASS_ATTRIBUTE;
};

const expressionClasses = (input: TmplAstBoundAttribute): TemplateClass[] => {
  const source = expressionSource(input.value);

  if (source === null) return [];

  const names = classExpressionLiterals(source);
  const templateClassOf = (name: string): TemplateClass => {
    const templateClass: TemplateClass = { name, span: input.sourceSpan };

    return templateClass;
  };

  return names.map(templateClassOf);
};

const inputClasses = (input: TmplAstBoundAttribute): TemplateClass[] => {
  const bound = boundClassName(input);

  if (bound !== null) {
    const templateClass: TemplateClass = { name: bound, span: input.keySpan };

    return [templateClass];
  }

  const isExpression = isClassExpression(input);

  if (!isExpression) return [];

  return expressionClasses(input);
};

export const templateClasses = (node: ClassAttributeHost): TemplateClass[] => {
  const classes: TemplateClass[] = [];

  for (const attribute of node.attributes) {
    const isClassName = attribute.name === CLASS_ATTRIBUTE;

    if (isClassName) classes.push(...staticClasses(attribute));
  }

  for (const input of node.inputs) {
    classes.push(...inputClasses(input));
  }

  return classes;
};
