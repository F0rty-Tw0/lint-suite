import { resolve } from 'node:path';

import type ts from 'typescript';

import { collectAngularTemplateReads } from './angular-template-reads.js';
import { collectTypeScriptReads } from './typescript-reads.js';

type ProjectUsageIndex = {
  readonly has: (declaration: ts.Declaration) => boolean;
};

const projectUsageCache = new WeakMap<ts.Program, ProjectUsageIndex | null>();

// Parser and Angular programs own different nodes; source spans preserve declaration identity.
const memberKey = (declaration: ts.Declaration): string => {
  const sourceFile = declaration.getSourceFile();

  return `${resolve(sourceFile.fileName)}:${declaration.getStart(sourceFile)}:${declaration.getEnd()}`;
};

const buildProjectUsage = (program: ts.Program): ProjectUsageIndex | null => {
  try {
    const configFilePath = program.getCompilerOptions()['configFilePath'];

    if (typeof configFilePath !== 'string') {
      return null;
    }

    const keys = new Set<string>();
    const addDeclaration = (declaration: ts.Declaration): void => {
      keys.add(memberKey(declaration));
    };

    collectTypeScriptReads(program, addDeclaration);

    if (!collectAngularTemplateReads(configFilePath, addDeclaration)) {
      return null;
    }

    return Object.freeze({
      has: (declaration: ts.Declaration): boolean =>
        keys.has(memberKey(declaration))
    });
  } catch {
    return null;
  }
};

export const projectUsage = (program: ts.Program): ProjectUsageIndex | null => {
  if (projectUsageCache.has(program)) {
    return projectUsageCache.get(program) ?? null;
  }

  const usage = buildProjectUsage(program);

  projectUsageCache.set(program, usage);
  return usage;
};
