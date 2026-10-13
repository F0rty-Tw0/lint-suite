import {
  isArrayBindingPattern,
  isIdentifier,
  isObjectBindingPattern,
  isOmittedExpression
} from 'typescript';
import type {
  ArrayBindingElement,
  BindingElement,
  BindingPattern,
  Node,
  TypeChecker
} from 'typescript';

import { propertyName } from './typescript-symbol-reads.ts';
import type {
  DestructuringPattern,
  PatternElementRead
} from '../common/project-usage.type.ts';

export const isBindingPattern = (node: Node): node is BindingPattern => {
  const isArrayPattern = isArrayBindingPattern(node);
  const isObjectPattern = isObjectBindingPattern(node);

  return isArrayPattern || isObjectPattern;
};

const nestedPattern = (
  element: BindingElement
): DestructuringPattern | null => {
  const isNested = isBindingPattern(element.name);

  if (!isNested) return null;

  return element.name;
};

const bindingNames = (
  checker: TypeChecker,
  element: BindingElement
): string[] | null => {
  if (element.propertyName) return propertyName(checker, element.propertyName);

  const isIdentifierName = isIdentifier(element.name);

  if (!isIdentifierName) return null;

  return [element.name.text];
};

const arrayElementRead = (
  element: ArrayBindingElement,
  index: number
): PatternElementRead | null => {
  const isOmitted = isOmittedExpression(element);

  if (isOmitted) return null;

  const isRestElement = Boolean(element.dotDotDotToken);
  const indexNames = [String(index)];
  const names = isRestElement ? null : indexNames;
  const nested = nestedPattern(element);
  const read: PatternElementRead = {
    location: element,
    names,
    nested,
    rest: false
  };

  return read;
};

const objectElementRead = (
  element: BindingElement,
  checker: TypeChecker
): PatternElementRead => {
  const isRestElement = Boolean(element.dotDotDotToken);

  if (isRestElement) {
    const restRead: PatternElementRead = {
      location: element,
      names: null,
      nested: null,
      rest: true
    };

    return restRead;
  }

  const read: PatternElementRead = {
    location: element,
    names: bindingNames(checker, element),
    nested: nestedPattern(element),
    rest: false
  };

  return read;
};

/** Reads made by every element of one array or object binding pattern. */
export const bindingPatternElements = (
  pattern: BindingPattern,
  checker: TypeChecker
): PatternElementRead[] => {
  const isArrayPattern = isArrayBindingPattern(pattern);

  if (isArrayPattern) {
    const reads: PatternElementRead[] = [];

    for (const [index, element] of pattern.elements.entries()) {
      const read = arrayElementRead(element, index);

      if (read !== null) {
        reads.push(read);
      }
    }

    return reads;
  }

  return pattern.elements.map((element) => objectElementRead(element, checker));
};
