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

type Slots = Map<string, ClassLikeDeclaration[][]>;

/** The arrays inside each index that hold a class, by file and class name. */
const slotsOf = new WeakMap<DirectiveIndex, Slots>();

const classKey = ({ declaration, name }: AngularClass): string => {
  return `${declaration.getSourceFile().fileName}\0${name}`;
};

const addSlot = (
  slots: Slots,
  angularClass: AngularClass,
  holder: ClassLikeDeclaration[]
): void => {
  const key = classKey(angularClass);
  const holders = slots.get(key) ?? [];

  holders.push(holder);
  slots.set(key, holders);
};

export const buildDirectiveIndex = (
  classes: Iterable<AngularClass>
): DirectiveIndex => {
  const byDeclaration = new Map<ClassLikeDeclaration, AngularClass>();
  const byExportAs = new Map<string, ClassLikeDeclaration[]>();
  const componentMatcher = new SelectorMatcher<ClassLikeDeclaration[]>();
  const slots: Slots = new Map();

  for (const angularClass of classes) {
    const { component, declaration, exportAs, selector } = angularClass;

    byDeclaration.set(declaration, angularClass);

    for (const name of exportAs) {
      const declarations = byExportAs.get(name) ?? [];

      declarations.push(declaration);
      byExportAs.set(name, declarations);
      addSlot(slots, angularClass, declarations);
    }

    if (component && selector !== null) {
      const selectors = parseSelector(selector);

      if (selectors) {
        const holder = [declaration];

        componentMatcher.addSelectables(selectors, holder);
        addSlot(slots, angularClass, holder);
      }
    }
  }

  const directiveIndex: DirectiveIndex = {
    byDeclaration,
    byExportAs,
    componentMatcher
  };

  slotsOf.set(directiveIndex, slots);

  return directiveIndex;
};

const repointHolders = (
  holders: ClassLikeDeclaration[][],
  previous: ClassLikeDeclaration,
  next: ClassLikeDeclaration
): void => {
  for (const holder of holders) {
    const position = holder.indexOf(previous);

    if (position >= 0) holder[position] = next;
  }
};

/**
 * Points the index at a re-parsed file's class declarations without
 * rebuilding it; only valid when the file's directive shape is unchanged.
 */
export const replaceDeclarations = (
  index: DirectiveIndex,
  previous: Iterable<AngularClass>,
  next: Iterable<AngularClass>
): void => {
  const slots = slotsOf.get(index) ?? new Map<string, ClassLikeDeclaration[][]>();
  const nextByKey = new Map<string, AngularClass>();

  for (const angularClass of next) {
    nextByKey.set(classKey(angularClass), angularClass);
  }

  for (const angularClass of previous) {
    const key = classKey(angularClass);
    const replacement = nextByKey.get(key);

    if (!replacement) continue;

    const holders = slots.get(key) ?? [];

    repointHolders(holders, angularClass.declaration, replacement.declaration);
    index.byDeclaration.delete(angularClass.declaration);
    index.byDeclaration.set(replacement.declaration, replacement);
  }
};
