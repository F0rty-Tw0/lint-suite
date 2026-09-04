import { readFileSync, statSync } from 'node:fs';

import { CssSelector, SelectorMatcher } from '@angular/compiler';
import { isIdentifier, isStringLiteralLike } from 'typescript';
import type { ClassLikeDeclaration, TypeChecker } from 'typescript';

import type {
  AngularClass,
  DirectiveIndex,
  ReadSink,
  TemplateFileVersion,
  TemplateReads
} from '../common/project-usage.type.js';
import { addTemplateReads } from './angular-template-read-resolution.js';

const memberNames = (declaration: ClassLikeDeclaration): string[] =>
  declaration.members.flatMap((member) =>
    member.name &&
    (isIdentifier(member.name) || isStringLiteralLike(member.name))
      ? [member.name.text]
      : []
  );

/**
 * What a template we cannot read might reference: the component's own
 * members and those of every class in its scope, or every candidate name
 * when the scope is unknown.
 */
const unknownTemplateNames = (
  { declaration, scope }: AngularClass,
  allNames: ReadonlySet<string>
): Iterable<string> =>
  scope === null
    ? allNames
    : [...memberNames(declaration), ...scope.flatMap(memberNames)];

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

/**
 * A description of every directive's selector and exportAs; when it changes
 * between programs, cached template reference resolutions are stale.
 */
export const directiveShape = (classes: Iterable<AngularClass>): string =>
  [...classes]
    .map(
      ({ component, declaration, exportAs, hostDirectives, name, selector }) =>
        [
          declaration.getSourceFile().fileName,
          name,
          String(component),
          String(hostDirectives),
          selector ?? '',
          exportAs.join(',')
        ].join('\0')
    )
    .sort()
    .join('\n');

export const buildDirectiveIndex = (
  classes: Iterable<AngularClass>
): DirectiveIndex => {
  const byDeclaration = new Map<ClassLikeDeclaration, AngularClass>();
  const byExportAs = new Map<string, ClassLikeDeclaration[]>();
  const componentMatcher = new SelectorMatcher<ClassLikeDeclaration[]>();

  for (const angularClass of classes) {
    const { component, declaration, exportAs, selector } = angularClass;

    byDeclaration.set(declaration, angularClass);

    for (const name of exportAs) {
      const declarations = byExportAs.get(name) ?? [];

      declarations.push(declaration);
      byExportAs.set(name, declarations);
    }

    if (component && selector !== null) {
      try {
        componentMatcher.addSelectables(CssSelector.parse(selector), [
          declaration
        ]);
      } catch {
        // An unparsable selector never matches an element.
      }
    }
  }

  const directiveIndex: DirectiveIndex = {
    byDeclaration,
    byExportAs,
    componentMatcher
  };

  return directiveIndex;
};

/** Reads made by the templates of the components declared in one file. */
export const collectAngularTemplateReads = (
  classes: AngularClass[],
  checker: TypeChecker,
  sink: ReadSink,
  directives: DirectiveIndex,
  allNames: ReadonlySet<string>
): TemplateReads => {
  const templateVersions: TemplateFileVersion[] = [];
  let usedDirectiveIndex = false;

  for (const angularClass of classes) {
    const { declaration, template, valid } = angularClass;
    const fileName = declaration.getSourceFile().fileName;
    const className = declaration.name?.text ?? '(anonymous)';

    if (!valid) {
      sink.addFallbackNames(
        unknownTemplateNames(angularClass, allNames),
        `${fileName}: metadata of ${className} is not static (template, templateUrl)`
      );
      continue;
    }

    if (!template) continue;

    let source: string;
    let templateFileName = fileName;

    if (template.kind === 'inline') {
      source = template.source;
    } else {
      templateFileName = template.fileName;

      try {
        templateVersions.push(templateFileVersion(templateFileName));
        source = readFileSync(templateFileName, 'utf8');
      } catch {
        sink.addFallbackNames(
          unknownTemplateNames(angularClass, allNames),
          `${fileName}: templateUrl of ${className} cannot be read (${templateFileName})`
        );
        continue;
      }
    }

    const result = addTemplateReads(
      angularClass,
      source,
      templateFileName,
      checker,
      sink,
      directives
    );

    usedDirectiveIndex ||= result.usedDirectiveIndex;
  }

  const templateReads: TemplateReads = {
    templateVersions,
    usedDirectiveIndex
  };

  return templateReads;
};
