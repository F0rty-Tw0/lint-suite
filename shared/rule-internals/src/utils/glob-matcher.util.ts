import type { GlobMatcher } from '../common/glob-matcher.type.ts';

const GLOB_TOKEN = /\*\*\/|\*\*|\*|\?|\{[^}]*\}|[^*?{]+/gu;
const REGEXP_ESCAPE = /[.*+?^${}()|[\]\\]/gu;

const escapeLiteral = (value: string): string =>
  value.replaceAll(REGEXP_ESCAPE, '\\$&');

const braceAlternatives = (token: string): string => {
  const inner = token.slice(1, -1);
  const alternatives = inner.split(',').map(escapeLiteral);

  return `(?:${alternatives.join('|')})`;
};

const translateToken = (token: string): string => {
  if (token === '**/') return '(?:.*/)?';

  if (token === '**') return '.*';

  if (token === '*') return '[^/]*';

  if (token === '?') return '[^/]';

  const startsWithBrace = token.startsWith('{');
  const endsWithBrace = token.endsWith('}');

  if (startsWithBrace && endsWithBrace) return braceAlternatives(token);

  return escapeLiteral(token);
};

const globSource = (pattern: string): string => {
  const tokens = pattern.match(GLOB_TOKEN) ?? [];

  return tokens.map(translateToken).join('');
};

const ALL_DEPTH_PREFIX = '**/';
const ALL_DEPTH_GROUP = '(?:.*/)?';

const stripAllDepthPrefix = (pattern: string): string => {
  const hasPrefix = pattern.startsWith(ALL_DEPTH_PREFIX);

  if (!hasPrefix) return pattern;

  return pattern.slice(ALL_DEPTH_PREFIX.length);
};

const sharesAllDepthPrefix = (patterns: string[]): boolean =>
  patterns.every((pattern) => pattern.startsWith(ALL_DEPTH_PREFIX));

const combinedSource = (patterns: string[]): string => {
  const hoistPrefix = sharesAllDepthPrefix(patterns);

  if (!hoistPrefix) {
    const sources = patterns.map(globSource);

    return `(?:${sources.join('|')})`;
  }

  const bodies = patterns.map(stripAllDepthPrefix);
  const sources = bodies.map(globSource);

  return `${ALL_DEPTH_GROUP}(?:${sources.join('|')})`;
};

export const compileGlobs = (patterns: string[]): GlobMatcher => {
  const source = combinedSource(patterns);
  const combined = new RegExp(`^${source}$`, 'u');
  const matchPath = (path: string): boolean => {
    const normalised = path.replaceAll('\\', '/');

    return combined.test(normalised);
  };

  return matchPath;
};
