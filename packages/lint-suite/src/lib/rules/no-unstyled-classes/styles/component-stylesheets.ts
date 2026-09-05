import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { ObjectLiteralExpression } from 'typescript';

import {
  componentMetadata,
  metadataTexts
} from '../../component-metadata.ts';
import type { StylesheetSource } from '../common/no-unstyled-classes.type.ts';

const SIBLING_EXTENSIONS = ['.scss', '.css'];
const HTML_EXTENSION = /\.html$/iu;

const matchesTemplate = (
  metadata: ObjectLiteralExpression,
  directory: string,
  templateFilename: string
): boolean => {
  const urls = metadataTexts(metadata, 'templateUrl');
  const [templateUrl] = urls;

  if (templateUrl === undefined) return false;

  const declared = resolve(directory, templateUrl);
  const linted = resolve(templateFilename);

  return declared === linted;
};

const templateMetadata = (
  componentPath: string,
  templateFilename: string
): ObjectLiteralExpression | null => {
  const components = componentMetadata(componentPath);
  const directory = dirname(componentPath);
  const matches = (metadata: ObjectLiteralExpression): boolean => {
    return matchesTemplate(metadata, directory, templateFilename);
  };
  const matched = components.find(matches);

  if (matched !== undefined) return matched;

  const isOnly = components.length === 1;

  if (!isOnly) return null;

  const [only] = components;

  return only ?? null;
};

export const stylesheetFiles = (
  paths: string[],
  directory: string
): StylesheetSource[] => {
  const sources: StylesheetSource[] = [];

  for (const path of paths) {
    const resolved = resolve(directory, path);
    const isPresent = existsSync(resolved);

    if (!isPresent) continue;

    const source: StylesheetSource = { kind: 'file', path: resolved };

    sources.push(source);
  }

  return sources;
};

const inlineSources = (
  styles: string[],
  componentPath: string
): StylesheetSource[] => {
  const sourceOf = (style: string): StylesheetSource => {
    const source: StylesheetSource = {
      kind: 'inline',
      source: style,
      path: componentPath
    };

    return source;
  };

  return styles.map(sourceOf);
};

const metadataSources = (
  componentPath: string,
  templateFilename: string
): StylesheetSource[] => {
  const metadata = templateMetadata(componentPath, templateFilename);

  if (metadata === null) return [];

  const singleUrl = metadataTexts(metadata, 'styleUrl');
  const listedUrls = metadataTexts(metadata, 'styleUrls');
  const styles = metadataTexts(metadata, 'styles');
  const directory = dirname(componentPath);
  const urls = [...singleUrl, ...listedUrls];
  const files = stylesheetFiles(urls, directory);
  const inline = inlineSources(styles, componentPath);

  return [...files, ...inline];
};

const siblingSources = (templateFilename: string): StylesheetSource[] => {
  const base = templateFilename.replace(HTML_EXTENSION, '');
  const candidateOf = (extension: string): string => `${base}${extension}`;
  const candidates = SIBLING_EXTENSIONS.map(candidateOf);

  return stylesheetFiles(candidates, dirname(templateFilename));
};

export const componentStylesheets = (
  templateFilename: string
): StylesheetSource[] => {
  const componentPath = templateFilename.replace(HTML_EXTENSION, '.ts');
  const sources = metadataSources(componentPath, templateFilename);

  if (sources.length > 0) return sources;

  return siblingSources(templateFilename);
};
