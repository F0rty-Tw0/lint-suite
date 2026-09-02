import { statSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Declaration, Node, Program } from 'typescript';

import { collectAngularTemplateReads } from './angular/angular-template-reads.js';
import type { ProjectUsageIndex } from './common/project-usage.type.js';
import { collectTypeScriptReads } from './typescript/typescript-reads.js';

type TemplateFileVersion = {
  readonly fileName: string;
  readonly mtimeNs: bigint;
  readonly size: bigint;
};

type ProjectUsageCacheEntry = {
  readonly templateFileVersions: TemplateFileVersion[];
  readonly usage: ProjectUsageIndex;
  checkDuration: number;
  checkedAt: number;
};

const projectUsageCache = new WeakMap<Program, ProjectUsageCacheEntry>();

const templateFileVersion = (fileName: string): TemplateFileVersion => {
  const { mtimeNs, size } = statSync(fileName, { bigint: true });

  return { fileName: resolve(fileName), mtimeNs, size };
};

const templateFileVersionsAreCurrent = (
  versions: TemplateFileVersion[]
): boolean => {
  try {
    return versions.every(({ fileName, mtimeNs, size }) => {
      const current = statSync(fileName, { bigint: true });

      return current.mtimeNs === mtimeNs && current.size === size;
    });
  } catch {
    return false;
  }
};

// ponytail: re-stat templates at most every 20x the cost of the last check,
// so the O(files x templates) stat churn stays under ~5% of lint time.
const cacheEntryIsCurrent = (entry: ProjectUsageCacheEntry): boolean => {
  const now = performance.now();

  if (now - entry.checkedAt < entry.checkDuration * 20) {
    return true;
  }

  const current = templateFileVersionsAreCurrent(entry.templateFileVersions);

  entry.checkedAt = now;
  entry.checkDuration = performance.now() - now;

  return current;
};

const buildProjectUsage = (program: Program): ProjectUsageCacheEntry | null => {
  try {
    const configFilePath = program.getCompilerOptions()['configFilePath'];

    if (typeof configFilePath !== 'string') {
      return null;
    }

    const declarations = new Set<Node>();
    const addDeclaration = (declaration: Declaration): void => {
      declarations.add(declaration);
    };

    collectTypeScriptReads(program, addDeclaration);

    const templateFiles = collectAngularTemplateReads(
      program,
      configFilePath,
      addDeclaration
    );

    if (!templateFiles) {
      return null;
    }

    return {
      checkDuration: 0,
      checkedAt: performance.now(),
      templateFileVersions: templateFiles.map(templateFileVersion),
      usage: {
        has: (node: Node): boolean => declarations.has(node)
      }
    };
  } catch {
    return null;
  }
};

export const projectUsage = (program: Program): ProjectUsageIndex | null => {
  const cached = projectUsageCache.get(program);

  if (cached && cacheEntryIsCurrent(cached)) {
    return cached.usage;
  }

  const built = buildProjectUsage(program);

  if (!built) {
    projectUsageCache.delete(program);
    return null;
  }

  projectUsageCache.set(program, built);
  return built.usage;
};
