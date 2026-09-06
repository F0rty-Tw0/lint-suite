import {
  ScriptTarget,
  canHaveDecorators,
  createSourceFile,
  forEachChild,
  getDecorators,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteralLike
} from 'typescript';
import type {
  Decorator,
  Expression,
  Node,
  ObjectLiteralExpression
} from 'typescript';

import type { ComponentDescriptor } from './common/class-usage.type.ts';
import { createFileCache, readCached } from './file-cache.ts';

const COMPONENT_MARKER = '@Component';

const cache = createFileCache<ComponentDescriptor[]>('component-metadata');

const componentArgument = (
  decorator: Decorator
): ObjectLiteralExpression | null => {
  const { expression } = decorator;

  if (!isCallExpression(expression)) return null;

  if (!isIdentifier(expression.expression)) return null;

  const isComponent = expression.expression.text === 'Component';

  if (!isComponent) return null;

  const [argument] = expression.arguments;

  if (argument === undefined) return null;

  if (!isObjectLiteralExpression(argument)) return null;

  return argument;
};

const decoratedMetadata = (node: Node): ObjectLiteralExpression | null => {
  if (!canHaveDecorators(node)) return null;

  const decorators = getDecorators(node) ?? [];

  for (const decorator of decorators) {
    const metadata = componentArgument(decorator);

    if (metadata !== null) return metadata;
  }

  return null;
};

const literalText = (node: Expression): string | null => {
  if (!isStringLiteralLike(node)) return null;

  return node.text;
};

const literalTexts = (node: Expression): string[] => {
  const single = literalText(node);

  if (single !== null) return [single];

  if (!isArrayLiteralExpression(node)) return [];

  const texts: string[] = [];

  for (const element of node.elements) {
    const text = literalText(element);

    if (text !== null) texts.push(text);
  }

  return texts;
};

const metadataValue = (
  metadata: ObjectLiteralExpression,
  name: string
): Expression | null => {
  for (const property of metadata.properties) {
    if (!isPropertyAssignment(property)) continue;

    if (!isIdentifier(property.name)) continue;

    const isMatch = property.name.text === name;

    if (isMatch) return property.initializer;
  }

  return null;
};

const metadataTexts = (
  metadata: ObjectLiteralExpression,
  name: string
): string[] => {
  const value = metadataValue(metadata, name);

  if (value === null) return [];

  return literalTexts(value);
};

const toDescriptor = (
  metadata: ObjectLiteralExpression
): ComponentDescriptor => {
  const [templateUrl] = metadataTexts(metadata, 'templateUrl');
  const [template] = metadataTexts(metadata, 'template');
  const styleUrl = metadataTexts(metadata, 'styleUrl');
  const listedStyleUrls = metadataTexts(metadata, 'styleUrls');
  const styleUrls = [...styleUrl, ...listedStyleUrls];
  const styles = metadataTexts(metadata, 'styles');
  const descriptor: ComponentDescriptor = {
    templateUrl: templateUrl ?? null,
    template: template ?? null,
    styleUrls,
    styles
  };

  return descriptor;
};

const parseComponentMetadata = (
  text: string,
  path: string
): ComponentDescriptor[] => {
  const found: ComponentDescriptor[] = [];
  const hasComponent = text.includes(COMPONENT_MARKER);

  if (!hasComponent) return found;

  const visit = (node: Node): void => {
    const metadata = decoratedMetadata(node);

    if (metadata !== null) found.push(toDescriptor(metadata));

    forEachChild(node, visit);
  };

  const source = createSourceFile(path, text, ScriptTarget.Latest, true);

  forEachChild(source, visit);

  return found;
};

export const componentMetadata = (path: string): ComponentDescriptor[] => {
  return readCached(cache, path, parseComponentMetadata) ?? [];
};
