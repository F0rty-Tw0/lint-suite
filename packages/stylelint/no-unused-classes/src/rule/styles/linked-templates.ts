import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import {
  createFileCache,
  readCached
} from '@lint-suite/rule-internals/file-cache.ts';
import { linkedStylesheetHrefs } from '@lint-suite/rule-internals/utils/template-links.util.ts';

type LinkIndex = {
  readonly builtAt: number;
  readonly buildDuration: number;
  readonly templates: ReadonlyMap<string, string[]>;
};

const TEMPLATE_EXTENSION = /\.html$/iu;
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage']);

const links = createFileCache<string[]>('template-links');

let linkIndex: LinkIndex | null = null;

/** Relative stylesheet hrefs a template links, cached by the template's mtime. */
export const templateLinks = (templatePath: string): string[] => {
  return readCached(links, templatePath, linkedStylesheetHrefs) ?? [];
};

const isWalkable = (name: string): boolean => {
  const isDotfile = name.startsWith('.');

  if (isDotfile) return false;

  return !SKIPPED_DIRECTORIES.has(name);
};

const walkTemplates = (root: string): string[] => {
  const found: string[] = [];
  const pending = [root];

  while (pending.length > 0) {
    const directory = pending.pop();

    if (directory === undefined) break;

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const isDirectory = entry.isDirectory();

      if (isDirectory) {
        const canWalk = isWalkable(entry.name);

        if (canWalk) pending.push(path);

        continue;
      }

      const isTemplate = TEMPLATE_EXTENSION.test(entry.name);

      if (isTemplate) found.push(path);
    }
  }

  return found;
};

const templatesUnder = (root: string): string[] => {
  try {
    return walkTemplates(root);
  } catch {
    return [];
  }
};

const templatesByStylesheet = (root: string): Map<string, string[]> => {
  const byStylesheet = new Map<string, string[]>();

  for (const template of templatesUnder(root)) {
    const directory = dirname(template);

    for (const href of templateLinks(template)) {
      const stylesheet = resolve(directory, href);
      const linked = byStylesheet.get(stylesheet) ?? [];

      linked.push(template);
      byStylesheet.set(stylesheet, linked);
    }
  }

  return byStylesheet;
};

const currentLinkIndex = (): LinkIndex => {
  const now = performance.now();
  const cached = linkIndex;
  const isFresh =
    cached !== null && now - cached.builtAt < cached.buildDuration * 100;

  if (isFresh) return cached;

  const templates = templatesByStylesheet(process.cwd());
  const fresh: LinkIndex = {
    builtAt: now,
    buildDuration: performance.now() - now,
    templates
  };

  linkIndex = fresh;

  return fresh;
};

/**
 * Every template under the working directory that links the stylesheet.
 * The walk is rebuilt at most every 100x its own duration, so a link added
 * elsewhere in the project shows up on a later lint.
 */
export const linkedTemplates = (stylesheetPath: string): string[] => {
  return currentLinkIndex().templates.get(stylesheetPath) ?? [];
};
