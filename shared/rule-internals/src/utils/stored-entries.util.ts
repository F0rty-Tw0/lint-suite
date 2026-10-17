import type { CachedFile } from '../common/file-cache.type.ts';

const isCachedFile = <T>(value: unknown): value is CachedFile<T> => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  const hasVersion = 'version' in value && typeof value.version === 'string';

  return hasVersion && 'value' in value;
};

export const storedEntries = <T>(text: string): Map<string, CachedFile<T>> => {
  const entries = new Map<string, CachedFile<T>>();
  const parsed: unknown = JSON.parse(text);
  const isRecord = typeof parsed === 'object' && parsed !== null;

  if (!isRecord) return entries;

  for (const [path, entry] of Object.entries(parsed)) {
    if (isCachedFile<T>(entry)) entries.set(path, entry);
  }

  return entries;
};
