import { readFileSync, statSync } from 'node:fs';

import type { ObjectLiteralExpression } from 'typescript';

import type { ComponentDescriptor } from '../../common/class-usage.type.ts';
import { metadataTexts, parseComponentMetadata } from '../../component-metadata.ts';

const COMPONENT_MARKER = '@Component';

type CachedDescriptors = {
  readonly descriptors: ComponentDescriptor[];
  readonly version: string;
};

const cache = new Map<string, CachedDescriptors>();

const toDescriptor = (
  metadata: ObjectLiteralExpression
): ComponentDescriptor => {
  const [templateUrl] = metadataTexts(metadata, 'templateUrl');
  const [template] = metadataTexts(metadata, 'template');
  const styleUrls = [
    ...metadataTexts(metadata, 'styleUrl'),
    ...metadataTexts(metadata, 'styleUrls')
  ];
  const descriptor: ComponentDescriptor = {
    templateUrl: templateUrl ?? null,
    template: template ?? null,
    styleUrls
  };

  return descriptor;
};

const parseDescriptors = (
  text: string,
  path: string
): ComponentDescriptor[] => {
  const hasComponent = text.includes(COMPONENT_MARKER);

  if (!hasComponent) return [];

  return parseComponentMetadata(text, path).map(toDescriptor);
};

export const componentDescriptors = (path: string): ComponentDescriptor[] => {
  try {
    const stats = statSync(path, { bigint: true });
    const version = `${stats.mtimeNs}:${stats.size}`;
    const cached = cache.get(path);

    if (cached?.version === version) return cached.descriptors;

    const descriptors = parseDescriptors(readFileSync(path, 'utf8'), path);
    const fresh: CachedDescriptors = { descriptors, version };

    cache.set(path, fresh);

    return descriptors;
  } catch {
    return [];
  }
};
