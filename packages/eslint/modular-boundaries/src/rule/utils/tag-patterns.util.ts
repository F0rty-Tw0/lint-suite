import type {
  CompiledPatterns,
  Constraint,
  SpecifierMatcher,
  TagMatcher
} from '../common/modular-boundaries.type.ts';

const ANY_TAGS: TagMatcher = () => true;

export const mapGlobToRegExp = (pattern: string): RegExp => {
  const wildcards = pattern.split(/(?:\.\*)|\*+/u).join('.*');

  return new RegExp(`^${wildcards}$`);
};

const isRegexTag = (pattern: string): boolean => {
  return pattern.startsWith('/') && pattern.endsWith('/');
};

const someTagMatcher = (regex: RegExp): TagMatcher => {
  const matches: TagMatcher = (tags) => tags.some((tag) => regex.test(tag));

  return matches;
};

/** `*`, a `/regex/`, a `*` glob, or one exact tag. */
export const tagMatcher = (pattern: string): TagMatcher => {
  if (pattern === '*') return ANY_TAGS;

  const isRegex = isRegexTag(pattern);

  if (isRegex) {
    const source = pattern.substring(1, pattern.length - 1);

    return someTagMatcher(new RegExp(source));
  }

  const isGlob = pattern.includes('*');

  if (isGlob) return someTagMatcher(mapGlobToRegExp(pattern));

  const matches: TagMatcher = (tags) => tags.includes(pattern);

  return matches;
};

const matchOneMoreSegment = (pattern: string, specifier: string): boolean => {
  const prefix = pattern.slice(0, -1);
  const hasPrefix = specifier.startsWith(prefix);

  if (!hasPrefix) return false;

  const rest = specifier.slice(prefix.length);

  return !rest.includes('/');
};

const matchPrefixAndSuffix = (pattern: string, specifier: string): boolean => {
  const [prefix = '', suffix = ''] = pattern.split('/**/');

  return specifier.startsWith(prefix) && specifier.endsWith(suffix);
};

const wildcardMatcher = (pattern: string): SpecifierMatcher | undefined => {
  const isDeepPattern = pattern.endsWith('/**');
  const isSegmentPattern = pattern.endsWith('/*');
  const isInfixPattern = pattern.includes('/**/');
  const prefix = pattern.slice(0, -2);
  const deep: SpecifierMatcher = (specifier) => specifier.startsWith(prefix);
  const segment: SpecifierMatcher = (specifier) =>
    matchOneMoreSegment(pattern, specifier);
  const infix: SpecifierMatcher = (specifier) =>
    matchPrefixAndSuffix(pattern, specifier);

  if (isDeepPattern) return deep;

  if (isSegmentPattern) return segment;

  if (isInfixPattern) return infix;

  return undefined;
};

/** An `allow` entry: trailing `/**`, trailing `/*`, an inner globstar, else an unanchored regex. */
export const importMatcher = (pattern: string): SpecifierMatcher => {
  const wildcard = wildcardMatcher(pattern);

  if (wildcard) return wildcard;

  const regex = new RegExp(pattern);
  const matches: SpecifierMatcher = (specifier) => regex.test(specifier);

  return matches;
};

const tagPatternsOf = (constraint: Constraint): string[] => {
  const { match, onlyTags = [], notTags = [] } = constraint;
  const { anyOf = [], allOf = [] } = match;
  const patterns = [...anyOf, ...allOf, ...onlyTags, ...notTags];

  return patterns;
};

const globPatternsOf = (constraint: Constraint): string[] => {
  const { allowedExternal = [], bannedExternal = [] } = constraint;
  const patterns = [...allowedExternal, ...bannedExternal];

  return patterns;
};

const tagEntry = (pattern: string): [string, TagMatcher] => {
  const entry: [string, TagMatcher] = [pattern, tagMatcher(pattern)];

  return entry;
};

const globEntry = (pattern: string): [string, RegExp] => {
  const entry: [string, RegExp] = [pattern, mapGlobToRegExp(pattern)];

  return entry;
};

/** Every tag and external-import pattern of `constraints`, compiled once. */
export const compiledPatterns = (
  constraints: Constraint[]
): CompiledPatterns => {
  const tagPatterns = constraints.flatMap(tagPatternsOf);
  const globPatterns = constraints.flatMap(globPatternsOf);
  const tags = new Map(tagPatterns.map(tagEntry));
  const globs = new Map(globPatterns.map(globEntry));
  const patterns: CompiledPatterns = { tags, globs };

  return patterns;
};

export const tagMatcherIn = (
  patterns: CompiledPatterns,
  pattern: string
): TagMatcher => {
  return patterns.tags.get(pattern) ?? tagMatcher(pattern);
};

export const globRegExpIn = (
  patterns: CompiledPatterns,
  pattern: string
): RegExp => {
  return patterns.globs.get(pattern) ?? mapGlobToRegExp(pattern);
};
