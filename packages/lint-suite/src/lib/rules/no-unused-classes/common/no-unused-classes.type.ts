import type { ClassMatcher } from '../../common/class-usage.type.ts';

export type RuleOptions = {
  readonly ignoreClassPatterns: string[];
};

type FileTemplate = {
  readonly kind: 'file';
  readonly path: string;
};

type InlineTemplate = {
  readonly kind: 'inline';
  readonly source: string;
  readonly path: string;
};

type UnknownTemplate = {
  readonly kind: 'unknown';
};

export type TemplateSource = FileTemplate | InlineTemplate | UnknownTemplate;

export type TemplateUsage = {
  readonly has: ClassMatcher;
  readonly isDynamic: boolean;
  readonly size: number;
};
