import { readFileSync, statSync } from 'node:fs';
import { dirname, normalize } from 'node:path';

import { isIdentifier, isStringLiteralLike } from 'typescript';
import type { ClassElement, ClassLikeDeclaration } from 'typescript';

import { addTemplateReads } from './angular-template-read-resolution.ts';
import type {
  TemplateFileVersion,
  TemplateReads
} from '../common/project-index.type.ts';
import type {
  AngularClass,
  CandidateNames,
  CollectTemplateReadsOptions,
  ReadSink
} from '../common/project-usage.type.ts';

type TemplateSource = {
  readonly fileName: string;
  readonly source: string;
};

/** The version of a template file that does not exist; current until it does. */
const MISSING = -1n;

const memberNameOf = (member: ClassElement): string[] => {
  const name = member.name;

  if (!name) return [];

  const isIdentifierName = isIdentifier(name);
  const isStringName = isStringLiteralLike(name);
  const isTextName = isIdentifierName || isStringName;

  if (!isTextName) return [];

  const names = [name.text];

  return names;
};

const memberNames = (declaration: ClassLikeDeclaration): string[] => {
  return declaration.members.flatMap(memberNameOf);
};

const unknownTemplateNames = (
  { declaration, scope }: AngularClass,
  allNames: CandidateNames
): Iterable<string> => {
  if (scope === null) return allNames;

  const scopeNames = scope.flatMap(memberNames);
  const declarationNames = memberNames(declaration);
  const names = [...declarationNames, ...scopeNames];

  return names;
};

const IDENTIFIER = /[A-Za-z_$][\w$]*/gu;

const addTemplateMentions = (source: string, sink: ReadSink): void => {
  for (const [name] of source.matchAll(IDENTIFIER)) sink.addMention(name);
};

const templateFileVersion = (fileName: string): TemplateFileVersion => {
  const directory = dirname(normalize(fileName));

  try {
    const { mtimeNs, size } = statSync(fileName, { bigint: true });
    const version: TemplateFileVersion = { directory, fileName, mtimeNs, size };

    return version;
  } catch {
    const missing: TemplateFileVersion = {
      directory,
      fileName,
      mtimeNs: MISSING,
      size: MISSING
    };

    return missing;
  }
};

export const templateFileIsCurrent = (
  version: TemplateFileVersion
): boolean => {
  try {
    const current = statSync(version.fileName, { bigint: true });

    return current.mtimeNs === version.mtimeNs && current.size === version.size;
  } catch {
    return version.mtimeNs === MISSING;
  }
};

const templateSourceOf = (
  angularClass: AngularClass,
  allNames: CandidateNames,
  sink: ReadSink,
  versions: TemplateFileVersion[]
): TemplateSource | null => {
  const { declaration, template, valid } = angularClass;
  const fileName = declaration.getSourceFile().fileName;
  const className = declaration.name?.text ?? '(anonymous)';

  if (!valid) {
    const names = unknownTemplateNames(angularClass, allNames);
    const reason = `${fileName}: metadata of ${className} is not static (template, templateUrl)`;

    sink.addFallbackNames(names, reason);

    return null;
  }

  if (!template) return null;

  if (template.kind === 'inline') {
    const inlineSource: TemplateSource = { fileName, source: template.source };

    return inlineSource;
  }

  const templateFileName = template.fileName;

  versions.push(templateFileVersion(templateFileName));

  try {
    const source = readFileSync(templateFileName, 'utf8');
    const externalSource: TemplateSource = {
      fileName: templateFileName,
      source
    };

    return externalSource;
  } catch {
    const names = unknownTemplateNames(angularClass, allNames);
    const reason = `${fileName}: templateUrl of ${className} cannot be read (${templateFileName})`;

    sink.addFallbackNames(names, reason);

    return null;
  }
};

/** Reads made by the templates of the components declared in one file. */
export const collectAngularTemplateReads = ({
  allNames,
  checker,
  classes,
  directives,
  sink
}: CollectTemplateReadsOptions): TemplateReads => {
  const templateVersions: TemplateFileVersion[] = [];
  let usedDirectiveIndex = false;

  for (const angularClass of classes) {
    const template = templateSourceOf(
      angularClass,
      allNames,
      sink,
      templateVersions
    );

    if (template === null) continue;

    addTemplateMentions(template.source, sink);

    const result = addTemplateReads({
      angularClass,
      checker,
      directives,
      fileName: template.fileName,
      sink,
      source: template.source
    });

    usedDirectiveIndex ||= result.usedDirectiveIndex;
  }

  const templateReads: TemplateReads = {
    templateVersions,
    usedDirectiveIndex
  };

  return templateReads;
};
