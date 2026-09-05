import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { componentDescriptors } from './component-descriptors.ts';
import type { ComponentDescriptor } from '../../common/class-usage.type.ts';
import type { TemplateSource } from '../common/no-unused-classes.type.ts';

const MODULE_EXTENSION = /\.ts$/iu;
const STYLE_EXTENSION = /\.(?:scss|sass|css)$/iu;

const UNKNOWN_TEMPLATE: TemplateSource = { kind: 'unknown' };

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

  for (const descriptor of componentDescriptors(componentPath)) {
    const declared = declaredStylesheets(descriptor, directory);
    const isMatch = declared.includes(stylesheetPath);

    if (!isMatch) continue;

    sources.push(componentTemplate(descriptor, componentPath));
  }

  return sources;
};

const directoryModules = (directory: string): string[] => {
  try {
    return readdirSync(directory).filter((file) => MODULE_EXTENSION.test(file));
  } catch {
    return [];
  }
};

const siblingTemplates = (stylesheetPath: string): TemplateSource[] => {
  const path = stylesheetPath.replace(STYLE_EXTENSION, '.html');
  const isPresent = existsSync(path);

  if (!isPresent) return [];

  const source: TemplateSource = { kind: 'file', path };

  return [source];
};

export const stylesheetTemplates = (
  stylesheetPath: string
): TemplateSource[] => {
  const resolved = resolve(stylesheetPath);
  const directory = dirname(resolved);
  const sources: TemplateSource[] = [];

  for (const file of directoryModules(directory)) {
    const componentPath = join(directory, file);

    sources.push(...matchedTemplates(componentPath, resolved));
  }

  if (sources.length > 0) return sources;

  return siblingTemplates(resolved);
};
