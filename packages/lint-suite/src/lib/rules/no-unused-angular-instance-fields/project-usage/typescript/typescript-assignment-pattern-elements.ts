import {
  isArrayLiteralExpression,
  isObjectLiteralExpression,
  isOmittedExpression,
  isPropertyAssignment,
  isSpreadAssignment,
  isSpreadElement
} from 'typescript';
import type {
  ArrayLiteralExpression,
  Expression,
  ObjectLiteralElementLike,
  TypeChecker
} from 'typescript';

import type {
  AssignmentPattern,
  DestructuringPattern,
  PatternElementRead
} from '../common/project-usage.type.ts';
import { propertyName } from './typescript-symbol-reads.ts';

const nestedPattern = (
  expression: Expression
): DestructuringPattern | null => {
  const isArrayLiteral = isArrayLiteralExpression(expression);
  const isObjectLiteral = isObjectLiteralExpression(expression);
  const isNested = isArrayLiteral || isObjectLiteral;

  if (!isNested) return null;

  return expression;
};

const nestedPropertyPattern = (
  property: ObjectLiteralElementLike
): DestructuringPattern | null => {
  const isAssignment = isPropertyAssignment(property);

  if (!isAssignment) return null;

  return nestedPattern(property.initializer);
};

const arrayElementRead = (
  element: Expression,
  index: number
): PatternElementRead | null => {
  const isOmitted = isOmittedExpression(element);

  if (isOmitted) return null;

  const isRestElement = isSpreadElement(element);
  const indexNames = [String(index)];
  const read: PatternElementRead = {
    location: element,
    names: isRestElement ? null : indexNames,
    nested: nestedPattern(element),
    rest: false
  };

  return read;
};

const propertyRead = (
  property: ObjectLiteralElementLike,
  checker: TypeChecker
): PatternElementRead => {
  const isRestProperty = isSpreadAssignment(property);

  if (isRestProperty) {
    const restRead: PatternElementRead = {
      location: property,
      names: null,
      nested: null,
      rest: true
    };

    return restRead;
  }

  const read: PatternElementRead = {
    location: property,
    names: propertyName(checker, property.name),
    nested: nestedPropertyPattern(property),
    rest: false
  };

  return read;
};

/** Reads made by every element of one destructuring assignment target. */
export const assignmentPatternElements = (
  pattern: AssignmentPattern,
  checker: TypeChecker
): PatternElementRead[] => {
  const isArrayPattern = isArrayLiteralExpression(pattern);

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

  return pattern.properties.map((property) => propertyRead(property, checker));
};
