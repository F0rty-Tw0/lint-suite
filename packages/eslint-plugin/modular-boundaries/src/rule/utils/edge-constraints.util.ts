import type {
  Constraint,
  ConstraintSet,
  EdgeReport,
  Project
} from '../common/modular-boundaries.type.ts';

import { hasTag } from './tag-patterns.util.ts';

type Edge = { source: Project; target: Project };

const carriesAnyTag = (
  project: Project,
  patterns: string[],
  matchesPackageName: boolean
): boolean => {
  const matchesPattern = (pattern: string): boolean => {
    const isPackageName = matchesPackageName && pattern === project.packageName;

    return isPackageName || hasTag(project.tags, pattern);
  };

  return patterns.some(matchesPattern);
};

const quoteTags = (patterns: string[]): string => {
  const quoted = patterns.map((pattern) => `'${pattern}'`);

  return quoted.join(', ');
};

const tagReport = (
  messageId: 'notTagsConstraintViolation' | 'onlyTagsConstraintViolation',
  constraint: Constraint,
  edge: Edge,
  patterns: string[]
): EdgeReport => {
  const isSourceSide = constraint.side === 'source';
  const other = isSourceSide ? edge.target : edge.source;
  const side = isSourceSide ? 'target' : 'source';
  const data = {
    source: edge.source.id,
    target: edge.target.id,
    side,
    project: other.id,
    tags: quoteTags(patterns),
    origin: constraint.origin
  };
  const report: EdgeReport = { messageId, data };

  return report;
};

const emptyOnlyTagsReport = (
  constraint: Constraint,
  edge: Edge
): EdgeReport => {
  const data = {
    source: edge.source.id,
    target: edge.target.id,
    origin: constraint.origin
  };
  const report: EdgeReport = {
    messageId: 'emptyOnlyTagsConstraintViolation',
    data
  };

  return report;
};

const violationOf = (
  constraint: Constraint,
  edge: Edge
): EdgeReport | undefined => {
  const { onlyTags, notTags, matchesPackageName } = constraint;
  const other = constraint.side === 'source' ? edge.target : edge.source;

  if (onlyTags?.length === 0) {
    const isTurbo = constraint.origin === 'turbo.json';
    const isTagged = other.tags.length > 0;

    if (isTagged || isTurbo) return emptyOnlyTagsReport(constraint, edge);
  }

  if (onlyTags && onlyTags.length > 0) {
    const allowed = carriesAnyTag(other, onlyTags, matchesPackageName);

    if (!allowed) {
      return tagReport(
        'onlyTagsConstraintViolation',
        constraint,
        edge,
        onlyTags
      );
    }
  }

  if (!notTags) return undefined;

  const denied = carriesAnyTag(other, notTags, matchesPackageName);

  if (!denied) return undefined;

  return tagReport('notTagsConstraintViolation', constraint, edge, notTags);
};

/** Spec § checks step 7: first failing matched constraint, in merge order. */
export const findConstraintViolation = (
  constraints: ConstraintSet,
  edge: Edge
): EdgeReport | undefined => {
  const sourceMatched = constraints.sourceMatches.get(edge.source) ?? [];
  const targetMatched = constraints.targetMatches.get(edge.target) ?? [];

  for (const constraint of constraints.constraints) {
    const matched =
      constraint.side === 'source' ? sourceMatched : targetMatched;
    const applies = matched.includes(constraint);

    if (!applies) continue;

    const report = violationOf(constraint, edge);

    if (report) return report;
  }

  return undefined;
};
