import { dirname, resolve } from 'node:path';

import { TSESTree } from '@typescript-eslint/utils';

import { key, metadataValue, text } from './angular-metadata-literals.ts';
import {
  expressionReads,
  externalTemplateReads,
  templateReads
} from './angular-template-parsing.ts';
import type { MetadataReadsOptions } from '../common/no-unused-angular-instance-fields.type.ts';

const addReads = (target: Set<string>, source: Set<string> | null): boolean => {
  if (!source) return false;

  for (const name of source) {
    target.add(name);
  }

  return true;
};

const hostPropertyReads = (
  property: TSESTree.Property,
  reads: Set<string>,
  filename: string
): boolean => {
  const name = key(property);
  const expression = text(property.value);

  if (name === null || expression === null) return false;

  const isPropertyBinding = name.startsWith('[');

  if (isPropertyBinding) {
    return addReads(reads, expressionReads(expression, filename, false));
  }

  const isEventBinding = name.startsWith('(');

  if (isEventBinding) {
    return addReads(reads, expressionReads(expression, filename, true));
  }

  return true;
};

const hostReads = (
  host: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!host) return true;

  if (host.type !== TSESTree.AST_NODE_TYPES.ObjectExpression) return false;

  const hasUnreadableKey = host.properties.some(
    (property) => key(property) === null
  );

  if (hasUnreadableKey) return false;

  for (const property of host.properties) {
    if (property.type !== TSESTree.AST_NODE_TYPES.Property) return false;

    const hasPropertyReads = hostPropertyReads(property, reads, filename);

    if (!hasPropertyReads) return false;
  }

  return true;
};

const inlineTemplateReads = (
  template: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!template) return true;

  const source = text(template);

  return source !== null && addReads(reads, templateReads(source, filename));
};

const externalTemplatePropertyReads = (
  templateUrl: TSESTree.Node | undefined,
  reads: Set<string>,
  filename: string
): boolean => {
  if (!templateUrl) return true;

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

/**
 * Names read by a class's host bindings and, for components, its template.
 * Returns null when the metadata cannot be read statically; with
 * `requireTemplate` false an unreadable template keeps the host reads
 * instead, for callers that resolve template reads elsewhere.
 */
export const metadataReads = (
  options: MetadataReadsOptions
): Set<string> | null => {
  const { filename, metadata } = options;
  const isUnreadableKey = (
    property: TSESTree.ObjectLiteralElement
  ): boolean => {
    return key(property) === null;
  };
  const hasUnreadableKey = metadata.properties.some(isUnreadableKey);

  if (hasUnreadableKey) return null;

  const reads = new Set<string>();
  const hostValue = metadataValue(metadata, 'host');
  const hasHostReads = hostReads(hostValue, reads, filename);

  if (!hasHostReads) return null;

  if (!options.component) return reads;

  const isRead = (name: string): boolean => reads.has(name);
  const hasRemainingReads = options.remainingNames.every(isRead);

  if (hasRemainingReads) return reads;

  const hasTemplateReads = componentTemplateReads(metadata, reads, filename);

  if (hasTemplateReads) return reads;

  if (!options.requireTemplate) return reads;

  return null;
};
