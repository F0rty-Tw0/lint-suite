import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  Lexer,
  ParseLocation,
  ParseSourceFile,
  ParseSourceSpan,
  Parser,
  R3TargetBinder,
  parseTemplate
} from '@angular/compiler';
import type { DirectiveMeta } from '@angular/compiler';
import { TSESTree } from '@typescript-eslint/utils';
import { collectAngularExpressionReads } from './utils/angular-expression-reads.util.js';

type ExternalTemplateCache = {
  readonly reads: Set<string> | null;
  readonly version: string;
};

const externalTemplates = new Map<string, ExternalTemplateCache>();
const parser = new Parser(new Lexer());
const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

const text = (node: TSESTree.Node | null | undefined): string | null => {
  if (
    node?.type === TSESTree.AST_NODE_TYPES.Literal &&
    typeof node.value === 'string'
  ) {
    return node.value;
  }

  return node?.type === TSESTree.AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
    ? node.quasis[0].value.cooked
    : null;
};

const templateReads = (
  template: string,
  filename: string
): Set<string> | null => {
  try {
    const result = parseTemplate(template, filename);

    if (result.errors?.length) {
      return null;
    }

    return collectAngularExpressionReads(
      result.nodes,
      templateBinder.bind({ template: result.nodes }),
      false
    );
  } catch {
    return null;
  }
};

const externalTemplateReads = (filename: string): Set<string> | null => {
  try {
    const stats = statSync(filename, { bigint: true });
    const version = `${stats.mtimeNs}:${stats.size}`;
    const cached = externalTemplates.get(filename);

    if (cached?.version === version) {
      return cached.reads;
    }

    const reads = templateReads(readFileSync(filename, 'utf8'), filename);

    externalTemplates.set(filename, { reads, version });
    return reads;
  } catch {
    return null;
  }
};

const expressionReads = (
  expression: string,
  filename: string,
  action: boolean
): Set<string> | null => {
  try {
    const file = new ParseSourceFile(expression, filename);
    const start = new ParseLocation(file, 0, 0, 0);
    const span = new ParseSourceSpan(start, start.moveBy(expression.length));
    const result = action
      ? parser.parseAction(expression, span, 0)
      : parser.parseBinding(expression, span, 0);

    if (result.errors.length > 0) {
      return null;
    }

    return collectAngularExpressionReads([result], undefined, action);
  } catch {
    return null;
  }
};

const addReads = (target: Set<string>, source: Set<string> | null): boolean => {
  if (!source) {
    return false;
  }

  for (const name of source) {
    target.add(name);
  }

  return true;
};

const key = (property: TSESTree.ObjectLiteralElement): string | null => {
  if (property.type !== TSESTree.AST_NODE_TYPES.Property || property.computed) {
    return null;
  }

  return property.key.type === TSESTree.AST_NODE_TYPES.Identifier
    ? property.key.name
    : text(property.key);
};

const metadataValue = (
  metadata: TSESTree.ObjectExpression,
  name: string
): TSESTree.Property['value'] | undefined => {
  for (const property of metadata.properties) {
    if (
      property.type === TSESTree.AST_NODE_TYPES.Property &&
      key(property) === name
    ) {
      return property.value;
    }
  }

  return undefined;
};

const hostPropertyReads = (
  property: TSESTree.Property,
  reads: Set<string>,
  filename: string
): boolean => {
  const name = key(property);
  const expression = text(property.value);

  if (name === null || expression === null) {
    return false;
  }

  if (name.startsWith('[')) {
    return addReads(reads, expressionReads(expression, filename, false));
  }

  if (name.startsWith('(')) {
    return addReads(reads, expressionReads(expression, filename, true));
  }

  return true;
};

const hostReads = (
  host: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!host) {
    return true;
  }

  if (
    host.type !== TSESTree.AST_NODE_TYPES.ObjectExpression ||
    host.properties.some((property) => key(property) === null)
  ) {
    return false;
  }

  for (const property of host.properties) {
    if (
      property.type !== TSESTree.AST_NODE_TYPES.Property ||
      !hostPropertyReads(property, reads, filename)
    ) {
      return false;
    }
  }

  return true;
};

const inlineTemplateReads = (
  template: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!template) {
    return true;
  }

  const source = text(template);

  return source !== null && addReads(reads, templateReads(source, filename));
};

const externalTemplatePropertyReads = (
  templateUrl: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!templateUrl) {
    return true;
  }

  const url = text(templateUrl);

  return (
    url !== null &&
    addReads(reads, externalTemplateReads(resolve(dirname(filename), url)))
  );
};

const componentTemplateReads = (
  metadata: TSESTree.ObjectExpression,
  reads: Set<string>,
  filename: string
): boolean => {
  const template = metadataValue(metadata, 'template');
  const templateUrl = metadataValue(metadata, 'templateUrl');

  return (
    inlineTemplateReads(template, reads, filename) &&
    externalTemplatePropertyReads(templateUrl, reads, filename)
  );
};

export const metadataReads = (
  metadata: TSESTree.ObjectExpression,
  component: boolean,
  filename: string,
  remainingNames: string[]
): Set<string> | null => {
  if (metadata.properties.some((property) => key(property) === null)) {
    return null;
  }

  const reads = new Set<string>();

  if (!hostReads(metadataValue(metadata, 'host'), reads, filename)) {
    return null;
  }

  if (
    (component && remainingNames.every((name) => reads.has(name))) ||
    !component ||
    componentTemplateReads(metadata, reads, filename)
  ) {
    return reads;
  }

  return null;
};
