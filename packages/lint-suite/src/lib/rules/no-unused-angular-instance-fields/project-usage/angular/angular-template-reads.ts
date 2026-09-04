import { readFileSync, statSync } from 'node:fs';

import { CssSelector, SelectorMatcher } from '@angular/compiler';
import { isIdentifier, isStringLiteralLike } from 'typescript';
import type {
  ClassElement,
  ClassLikeDeclaration,
  TypeChecker
} from 'typescript';

import type {
  AngularClass,
  DirectiveIndex,
  ReadSink,
  TemplateFileVersion,
  TemplateReads
} from '../common/project-usage.type.js';
import { addTemplateReads } from './angular-template-read-resolution.js';

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
  allNames: ReadonlySet<string>
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

/**
 * A description of every directive's selector and exportAs; when it changes
 * between programs, cached template reference resolutions are stale.
 */
const classShape = ({
  component,
  declaration,
  exportAs,
  hostDirectives,
  name,
  selector
}: AngularClass): string => {
  const fields = [
    declaration.getSourceFile().fileName,
    name,
    String(component),
    String(hostDirectives),
    selector ?? '',
    exportAs.join(',')
  ];

  return fields.join('\0');
};

export const directiveShape = (classes: Iterable<AngularClass>): string => {
  const shapes = [...classes].map(classShape);

  return shapes.sort().join('\n');
};

const parseSelector = (selector: string): CssSelector[] | null => {
  try {
    return CssSelector.parse(selector);
  } catch {
    return null;
  }
};

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
      const selectors = parseSelector(selector);

      if (selectors) {
        componentMatcher.addSelectables(selectors, [declaration]);
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
