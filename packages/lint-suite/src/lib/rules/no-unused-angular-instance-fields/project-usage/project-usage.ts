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
};

const projectUsageCache = new WeakMap<Program, ProjectUsageCacheEntry>();

const memberKey = (node: Node): string => {
  const sourceFile = node.getSourceFile();

  return `${resolve(sourceFile.fileName)}:${node.getStart(sourceFile)}:${node.getEnd()}`;
};

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

const buildProjectUsage = (program: Program): ProjectUsageCacheEntry | null => {
  try {
    const configFilePath = program.getCompilerOptions()['configFilePath'];

    if (typeof configFilePath !== 'string') {
      return null;
    }

    const keys = new Set<string>();
    const addDeclaration = (declaration: Declaration): void => {
      keys.add(memberKey(declaration));
    };

    collectTypeScriptReads(program, addDeclaration);

    const templateFiles = collectAngularTemplateReads(
      configFilePath,
      addDeclaration
    );

    if (!templateFiles) {
      return null;
    }

    return {
      templateFileVersions: templateFiles.map(templateFileVersion),
      usage: {
        has: (node: Node): boolean => keys.has(memberKey(node))
      }
    };
  } catch {
    return null;
  }
};

export const projectUsage = (program: Program): ProjectUsageIndex | null => {
  const cached = projectUsageCache.get(program);

  if (
    cached &&
    templateFileVersionsAreCurrent(cached.templateFileVersions)
  ) {
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
