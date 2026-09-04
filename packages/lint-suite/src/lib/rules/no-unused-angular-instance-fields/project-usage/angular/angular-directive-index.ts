import { CssSelector, SelectorMatcher } from '@angular/compiler';

import type { ClassLikeDeclaration } from 'typescript';

import type {
  AngularClass,
  DirectiveIndex
} from '../common/project-usage.type.ts';

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
