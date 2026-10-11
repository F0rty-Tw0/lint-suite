import type {
  ConfigError,
  Constraint,
  ConstraintMatch,
  JsonObject,
  ShapeReader
} from '../common/modular-boundaries.type.ts';

import { isRecord, isStringArray } from './guards.util.ts';

const reportShape = (
  reader: ShapeReader,
  path: string,
  expected: string
): void => {
  const message = `\`${path}\` must be ${expected}.`;
  const error: ConfigError = { file: reader.file, message };

  reader.errors.push(error);
};

/** Absent → `undefined` silently; present but not an object → shape error. */
export const optionalRecord = (
  reader: ShapeReader,
  value: unknown,
  path: string
): JsonObject => {
  if (value === undefined) return undefined;
  if (isRecord(value)) return value;

  reportShape(reader, path, 'an object');

  return undefined;
};

/** Absent → `undefined` silently; present but not a string array → shape error. */
export const optionalTags = (
  reader: ShapeReader,
  value: unknown,
  path: string
): string[] | undefined => {
  if (value === undefined) return undefined;
  if (isStringArray(value)) return value;

  reportShape(reader, path, 'an array of strings');

  return undefined;
};

/** A constraint matching projects tagged `tag`; Turborepo lists also match package names. */
export const tagConstraint = (
  side: Constraint['side'],
  tag: string,
  origin: Constraint['origin']
): Constraint => {
  const match: ConstraintMatch = { anyOf: [tag] };
  const constraint: Constraint = {
    side,
    match,
    matchesPackageName: origin === 'turbo.json',
    origin
  };

  return constraint;
};
