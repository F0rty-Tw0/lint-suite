import type {
  ParseSourceSpan,
  TmplAstBoundAttribute,
  TmplAstTextAttribute
} from '@angular/compiler';

export type ClassAttributeHost = {
  readonly attributes: TmplAstTextAttribute[];
  readonly inputs: TmplAstBoundAttribute[];
};

export type TemplateClass = {
  readonly name: string;
  readonly span: ParseSourceSpan;
};

export type SelectorClasses = {
  readonly exact: string[];
  readonly patterns: string[];
};

export type ClassExpressionUsage = {
  readonly names: string[];
  readonly patterns: string[];
  readonly isDynamic: boolean;
};

export type ClassMatcher = (name: string) => boolean;

export type ComponentDescriptor = {
  readonly templateUrl: string | null;
  readonly template: string | null;
  readonly styleUrls: string[];
};
