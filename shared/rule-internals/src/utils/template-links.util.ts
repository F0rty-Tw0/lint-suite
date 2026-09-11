const LINK_TAG = /<link\b[^>]*>/giu;
const STYLESHEET_REL = /\brel\s*=\s*["']stylesheet["']/iu;
const HREF = /\bhref\s*=\s*["']([^"']*)["']/iu;
const UNRESOLVABLE = /^(?:\/|[^:/?#]+:)/u;

const hrefOf = (tag: string): string | null => {
  const isStylesheet = STYLESHEET_REL.test(tag);

  if (!isStylesheet) return null;

  const href = HREF.exec(tag)?.[1] ?? '';
  const isUnresolvable = UNRESOLVABLE.test(href);
  const isLocal = href.length > 0 && !isUnresolvable;

  return isLocal ? href : null;
};

export const linkedStylesheetHrefs = (template: string): string[] => {
  const tags = template.match(LINK_TAG) ?? [];

  return tags.map(hrefOf).filter((href) => href !== null);
};
