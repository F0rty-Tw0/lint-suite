import { readFileSync, statSync } from 'node:fs';

import { isIdentifier, isStringLiteralLike } from 'typescript';
import type { ClassElement, ClassLikeDeclaration } from 'typescript';

import { addTemplateReads } from './angular-template-read-resolution.ts';
import type {
  AngularClass,
  CandidateNames,
  CollectTemplateReadsOptions,
  ReadSink,
  TemplateFileVersion,
  TemplateReads
} from '../common/project-usage.type.ts';

type TemplateSource = {
  readonly fileName: string;
  readonly source: string;
};

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

/**
 * What a template we cannot read might reference: the component's own
 * members and those of every class in its scope, or every candidate name
 * when the scope is unknown.
 */
const unknownTemplateNames = (
  { declaration, scope }: AngularClass,
  allNames: CandidateNames
): Iterable<string> => {
  if (scope === null) return allNames;

  const scopeNames = scope.flatMap(memberNames);
  const names = [...memberNames(declaration), ...scopeNames];

  return names;
};

const templateFileVersion = (fileName: string): TemplateFileVersion => {
  const { mtimeNs, size } = statSync(fileName, { bigint: true });

  const version: TemplateFileVersion = { fileName, mtimeNs, size };

  return version;
};

export const templateFileIsCurrent = (
  version: TemplateFileVersion
): boolean => {
  try {
    const current = statSync(version.fileName, { bigint: true });

    return current.mtimeNs === version.mtimeNs && current.size === version.size;
  } catch {
    return false;
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

  try {
    versions.push(templateFileVersion(templateFileName));

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
