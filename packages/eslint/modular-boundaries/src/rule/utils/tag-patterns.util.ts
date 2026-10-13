const regexBySource = new Map<string, RegExp>();

const cachedRegExp = (source: string): RegExp => {
  const cached = regexBySource.get(source);

  if (cached) return cached;

  const regex = new RegExp(source);

  regexBySource.set(source, regex);

  return regex;
};

export const mapGlobToRegExp = (pattern: string): RegExp => {
  const wildcards = pattern.split(/(?:\.\*)|\*+/u).join('.*');

  return cachedRegExp(`^${wildcards}$`);
};

const isRegexTag = (pattern: string): boolean => {
  return pattern.startsWith('/') && pattern.endsWith('/');
};

export const hasTag = (tags: string[], pattern: string): boolean => {
  if (pattern === '*') return true;

  const isRegex = isRegexTag(pattern);

  if (isRegex) {
    const source = pattern.substring(1, pattern.length - 1);
    const regex = cachedRegExp(source);

    return tags.some((tag) => regex.test(tag));
  }

  const isGlob = pattern.includes('*');

  if (isGlob) {
    const regex = mapGlobToRegExp(pattern);

    return tags.some((tag) => regex.test(tag));
  }

  return tags.includes(pattern);
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

export const matchImportWithWildcard = (
  pattern: string,
  specifier: string
): boolean => {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -2);

    return specifier.startsWith(prefix);
  }

  if (pattern.endsWith('/*')) return matchOneMoreSegment(pattern, specifier);
  if (pattern.includes('/**/')) return matchPrefixAndSuffix(pattern, specifier);

  const regex = cachedRegExp(pattern);

  return regex.test(specifier);
};
