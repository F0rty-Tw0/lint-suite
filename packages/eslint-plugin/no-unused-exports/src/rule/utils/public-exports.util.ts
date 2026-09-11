import { markUsage } from './export-usage.util.ts';
import { STAR_NAME } from '../common/no-unused-exports.const.ts';
import type {
  PublicExports,
  UsageContext
} from '../common/no-unused-exports.type.ts';

export const publicExports = (
  context: UsageContext,
  entryFiles: string[]
): PublicExports => {
  const index: PublicExports = new Map();

  for (const entryFile of entryFiles) {
    const keys = markUsage(context, entryFile, STAR_NAME);

    for (const key of keys) {
      const names = index.get(key.fileName) ?? new Set<string>();

      names.add(key.name);
      index.set(key.fileName, names);
    }
  }

  return index;
};
