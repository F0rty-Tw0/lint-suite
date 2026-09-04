import { dirname, resolve } from 'node:path';

import {
  isIdentifier,
  isNumericLiteral,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteralLike
} from 'typescript';
import type { Expression, ObjectLiteralExpression } from 'typescript';

import type {
  AngularTemplate,
  Discovery
} from '../common/project-usage.type.js';
import { resolveAlias } from './angular-decorator-kind.js';

/**
 * The string an expression evaluates to: a literal, or a constant whose
 * type is a single string literal (`const URL = './x.html'`, imported or
 * not). The constant's declaration file becomes a dependency.
 */
export const stringValue = (
  node: Expression | undefined,
  discovery: Discovery
): string | null => {
  if (!node) return null;

  const isStringLiteral = isStringLiteralLike(node);

  if (isStringLiteral) return node.text;

  const isIdentifierNode = isIdentifier(node);
  const isPropertyAccessNode = isPropertyAccessExpression(node);

  if (isIdentifierNode || isPropertyAccessNode) {
    const symbol = discovery.checker.getSymbolAtLocation(
      isIdentifier(node) ? node : node.name
    );

    if (symbol) {
      resolveAlias(symbol, discovery);
    }
  }

  const type = discovery.checker.getTypeAtLocation(node);

  return type.isStringLiteral() ? type.value : null;
};

export const metadataProperty = (
  metadata: ObjectLiteralExpression,
  name: string
): Expression | undefined => {
  for (const property of metadata.properties) {
    const isAssignment = isPropertyAssignment(property);

    if (!isAssignment) continue;

    const isIdentifierName = isIdentifier(property.name);
    const isStringName = isStringLiteralLike(property.name);
    const isNumericName = isNumericLiteral(property.name);
    const isLiteralName = isIdentifierName || isStringName || isNumericName;
    const isPropertyNamed = isLiteralName && property.name.text === name;

    if (isPropertyNamed) return property.initializer;
  }

  return undefined;
};

export const templateOf = (
  metadata: ObjectLiteralExpression,
  fileName: string,
  discovery: Discovery
): AngularTemplate | null | undefined => {
  const inline = metadataProperty(metadata, 'template');

  if (inline) {
    const source = stringValue(inline, discovery);

    return source === null ? undefined : { kind: 'inline', source };
  }

  const url = metadataProperty(metadata, 'templateUrl');

  if (url) {
    const text = stringValue(url, discovery);

    return text === null
      ? undefined
      : { kind: 'external', fileName: resolve(dirname(fileName), text) };
  }

  return null;
};

export const exportAsOf = (
  metadata: ObjectLiteralExpression,
  discovery: Discovery
): string[] =>
  (stringValue(metadataProperty(metadata, 'exportAs'), discovery) ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
