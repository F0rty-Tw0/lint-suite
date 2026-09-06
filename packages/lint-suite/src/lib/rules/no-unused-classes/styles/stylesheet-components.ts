import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { linkedTemplates } from './linked-templates.ts';
import type { ComponentDescriptor } from '../../common/class-usage.type.ts';
import { componentMetadata } from '../../component-metadata.ts';
import type { TemplateSource } from '../common/no-unused-classes.type.ts';

const MODULE_EXTENSION = /\.ts$/iu;
const STYLE_EXTENSION = /\.(?:scss|sass|css)$/iu;

const UNKNOWN_TEMPLATE: TemplateSource = { kind: 'unknown' };

const listings = new Map<string, DirectoryListing>();

type DirectoryListing = {
  readonly files: string[];
  readonly version: string;
};

const directoryListing = (directory: string): string[] => {
  const stats = statSync(directory, { bigint: true });
  const version = `${stats.mtimeNs}`;
  const cached = listings.get(directory);

  if (cached?.version === version) return cached.files;

  const files = readdirSync(directory);
  const fresh: DirectoryListing = { files, version };

  listings.set(directory, fresh);

  return files;
};

const declaredStylesheets = (
  descriptor: ComponentDescriptor,
  directory: string
): string[] => {
  const resolveUrl = (url: string): string => resolve(directory, url);

  return descriptor.styleUrls.map(resolveUrl);
};

const fileTemplate = (
  descriptor: ComponentDescriptor,
  directory: string
): TemplateSource | null => {
  if (descriptor.templateUrl === null) return null;

  const path = resolve(directory, descriptor.templateUrl);
  const isPresent = existsSync(path);

  if (!isPresent) return null;

  const source: TemplateSource = { kind: 'file', path };

  return source;
};

const inlineTemplate = (
  descriptor: ComponentDescriptor,
  componentPath: string
): TemplateSource | null => {
  if (descriptor.template === null) return null;

  const source: TemplateSource = {
    kind: 'inline',
    source: descriptor.template,
    path: componentPath
  };

  return source;
};

const componentTemplate = (
  descriptor: ComponentDescriptor,
  componentPath: string
): TemplateSource => {
  const directory = dirname(componentPath);
  const file = fileTemplate(descriptor, directory);

  if (file !== null) return file;

  const inline = inlineTemplate(descriptor, componentPath);

  return inline ?? UNKNOWN_TEMPLATE;
};

const matchedTemplates = (
  componentPath: string,
  stylesheetPath: string
): TemplateSource[] => {
  const directory = dirname(componentPath);
  const sources: TemplateSource[] = [];

  for (const descriptor of componentMetadata(componentPath)) {
    const declared = declaredStylesheets(descriptor, directory);
    const isMatch = declared.includes(stylesheetPath);

    if (!isMatch) continue;

    sources.push(componentTemplate(descriptor, componentPath));
  }

  return sources;
};

const directoryFiles = (directory: string, extension: RegExp): string[] => {
  try {
    return directoryListing(directory).filter((file) => extension.test(file));
  } catch {
    return [];
  }
};

const fallbackTemplates = (stylesheetPath: string): TemplateSource[] => {
  const sibling = stylesheetPath.replace(STYLE_EXTENSION, '.html');
  const paths = new Set<string>();

  const hasSibling = existsSync(sibling);

  if (hasSibling) paths.add(sibling);

  for (const path of linkedTemplates(stylesheetPath)) paths.add(path);

  const toSource = (path: string): TemplateSource => {
    const source: TemplateSource = { kind: 'file', path };

    return source;
  };

  const pathList = [...paths];

  return pathList.map(toSource);
};

export const stylesheetTemplates = (
  stylesheetPath: string
): TemplateSource[] => {
  const resolved = resolve(stylesheetPath);
  const directory = dirname(resolved);
  const sources: TemplateSource[] = [];

  for (const file of directoryFiles(directory, MODULE_EXTENSION)) {
    const componentPath = join(directory, file);
    const matched = matchedTemplates(componentPath, resolved);

    sources.push(...matched);
  }

  if (sources.length > 0) return sources;

  return fallbackTemplates(resolved);
};
