import type {
  ParserServicesWithTypeInformation,
  TSESLint,
  TSESTree
} from '@typescript-eslint/utils';

export type CallExemptions = {
  readonly allowed: RegExp[];
  readonly scope: TSESLint.Scope.Scope;
  readonly services: ParserServicesWithTypeInformation | undefined;
};

export type ConditionParts = {
  readonly calls: TSESTree.CallExpression[];
  readonly identifiers: TSESTree.Identifier[];
};

export type ConstFeed = {
  readonly init: TSESTree.Expression;
  readonly statement: TSESTree.VariableDeclaration;
};

export type MessageIds = 'callInCondition' | 'hoistCall';

export type RuleOptions = {
  readonly allowPredicates?: string[];
};

export type Options = [RuleOptions];

export type RuleContext = TSESLint.RuleContext<MessageIds, Options>;
