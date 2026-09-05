import type { ParseSourceSpan } from '@angular/compiler';

import type { TSESTree } from '@typescript-eslint/utils';

import type { ClassMatcher } from '../../common/class-usage.type.ts';

export type RuleOptions = {
  readonly ignoreClassPatterns: string[];
  readonly globalStyles: string[];
};

export type MessageIds = 'unstyledClass';

type FileStylesheet = {
  readonly kind: 'file';
  readonly path: string;
};

type InlineStylesheet = {
  readonly kind: 'inline';
  readonly source: string;
  readonly path: string;
};

export type StylesheetSource = FileStylesheet | InlineStylesheet;

export type StylesheetEntry = {
  readonly classes: string[];
  readonly patterns: string[];
  readonly imports: string[];
};

export type StylesheetClasses = {
  readonly has: ClassMatcher;
  readonly size: number;
};

export type StylesheetLookup = () => StylesheetClasses;

export type TemplateParserServices = {
  readonly convertNodeSourceSpanToLoc: (
    span: ParseSourceSpan
  ) => TSESTree.SourceLocation;
};
