import { isClassElement, isIdentifier, isStringLiteralLike } from 'typescript';
import type { Node, Program } from 'typescript';

import { buildDirectiveIndex } from './angular/angular-directive-index.ts';
import type {
  ProjectIndex,
  ProjectUsageIndex
} from './common/project-index.type.ts';
import { reconcile } from './project-index-reconciliation.ts';

const indexes = new Map<string, ProjectIndex>();

const memberName = (node: Node): string | null => {
  const isMember = isClassElement(node);

  if (!isMember) return null;

  if (!node.name) return null;

  const isIdentifierName = isIdentifier(node.name);
  const isStringName = isStringLiteralLike(node.name);
  const isNamedMember = isIdentifierName || isStringName;

  if (!isNamedMember) return null;

  return node.name.text;
};

const usageOf = (index: ProjectIndex): ProjectUsageIndex => {
  const { declarationCounts, fallbackNameCounts } = index;
  const has = (node: Node): boolean => {
    const hasDeclaration = declarationCounts.has(node);

    if (hasDeclaration) return true;

    if (fallbackNameCounts.size === 0) return false;

    const name = memberName(node);

    return name !== null && fallbackNameCounts.has(name);
  };
  const usage: ProjectUsageIndex = { has };

  return usage;
};

const createIndex = (): ProjectIndex => {
  const emptyIndex: ProjectIndex = {
    candidateNames: new Set(),
    classes: new Map(),
    declarationCounts: new Map(),
    directives: buildDirectiveIndex([]),
    directiveShape: '',
    entries: new Map(),
    fallbackNameCounts: new Map(),
    program: null,
    templateCheckDuration: 0,
    templateCheckedAt: 0
  };

  return emptyIndex;
};

/**
 * True when the index already reflects this exact Program, so callers can
 * skip local work the index duplicates (such as parsing a component's own
 * template) without ever triggering a build.
 */
export const projectUsageIsCurrent = (program: Program): boolean => {
  const configFilePath = program.getCompilerOptions()['configFilePath'];

  return (
    typeof configFilePath === 'string' &&
    indexes.get(configFilePath)?.program === program
  );
};

/**
 * Member declarations read anywhere in the Program's non-spec TypeScript
 * and Angular templates, or null when the project cannot be indexed
 * reliably. Indexes are kept per tsconfig and updated incrementally: a new
 * Program (an edit in the editor) only re-indexes the files that changed
 * and the files whose resolutions depended on them. `fileName` is the file
 * being linted; its own templates are always checked for freshness.
 */
export const projectUsage = (
  program: Program,
  fileName: string
): ProjectUsageIndex | null => {
  const configFilePath = program.getCompilerOptions()['configFilePath'];

  if (typeof configFilePath !== 'string') return null;

  let index = indexes.get(configFilePath);

  if (!index) {
    index = createIndex();
    indexes.set(configFilePath, index);
  }

  try {
    reconcile(index, program, fileName);

    return usageOf(index);
  } catch {
    indexes.delete(configFilePath);

    return null;
  }
};
