import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import {
  accessibilities,
  defaultOptions,
  meta
} from './common/explicit-accessibility.const.ts';
import type {
  Accessibility,
  AutoFix,
  Fix,
  FixAccessibility,
  Member,
  MessageIds,
  Options
} from './common/explicit-accessibility.type.ts';

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#explicit-accessibility'
);

const isPrivateMember = (node: Member): boolean => {
  if (node.type === TSESTree.AST_NODE_TYPES.TSParameterProperty) return false;

  return node.key.type === TSESTree.AST_NODE_TYPES.PrivateIdentifier;
};

const isConstructor = (node: Member): boolean => {
  if (node.type !== TSESTree.AST_NODE_TYPES.MethodDefinition) return false;

  return node.kind === 'constructor';
};

const reportTarget = (node: Member): TSESTree.Node => {
  if (node.type !== TSESTree.AST_NODE_TYPES.TSParameterProperty) {
    return node.key;
  }

  const { parameter } = node;

  if (parameter.type === TSESTree.AST_NODE_TYPES.AssignmentPattern) {
    return parameter.left;
  }

  return parameter;
};

const memberName = (
  target: TSESTree.Node,
  sourceCode: TSESLint.SourceCode
): string => {
  if (target.type === TSESTree.AST_NODE_TYPES.Identifier) return target.name;

  return sourceCode.getText(target);
};

const modifierToken = (
  node: Member,
  sourceCode: TSESLint.SourceCode
): TSESTree.Token | null => {
  const lastDecorator = node.decorators.at(-1);

  if (!lastDecorator) return sourceCode.getFirstToken(node);

  return sourceCode.getTokenAfter(lastDecorator);
};

const insertModifier = (
  node: Member,
  accessibility: Accessibility,
  sourceCode: TSESLint.SourceCode
): Fix => {
  const token = modifierToken(node, sourceCode);

  if (!token) return () => null;

  const lastDecorator = node.decorators.at(-1);
  const adjacentToDecorator = lastDecorator?.range[1] === token.range[0];
  const text = `${adjacentToDecorator ? ' ' : ''}${accessibility} `;

  return (fixer) => fixer.insertTextBefore(token, text);
};

const autoFixOf = (
  node: Member,
  accessibility: FixAccessibility,
  sourceCode: TSESLint.SourceCode
): AutoFix => {
  if (accessibility === 'none') {
    const noAutoFix: AutoFix = {};

    return noAutoFix;
  }

  const fix = insertModifier(node, accessibility, sourceCode);
  const autoFix: AutoFix = { fix };

  return autoFix;
};

const suggestionOf = (
  node: Member,
  accessibility: Accessibility,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds> => {
  const data = { accessibility };
  const fix = insertModifier(node, accessibility, sourceCode);
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'setAccessibility',
    data,
    fix
  };

  return suggestion;
};

const suggestionsOf = (
  node: Member,
  fixAccessibility: FixAccessibility,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds>[] => {
  const isOtherAccessibility = (accessibility: Accessibility): boolean => {
    return accessibility !== fixAccessibility;
  };

  const suggestionFor = (
    accessibility: Accessibility
  ): TSESLint.SuggestionReportDescriptor<MessageIds> => {
    return suggestionOf(node, accessibility, sourceCode);
  };

  return accessibilities.filter(isOtherAccessibility).map(suggestionFor);
};

export default createRule<Options, MessageIds>({
  name: 'explicit-accessibility',
  meta,
  defaultOptions,
  create(context, [{ defaultAccessibility = 'public' }]) {
    const { sourceCode } = context;

    const check = (node: Member): void => {
      const isPrivate = isPrivateMember(node);

      if (node.accessibility || isPrivate) return;

      const target = reportTarget(node);
      const isConstructorMember = isConstructor(node);
      const usesPublic = isConstructorMember && defaultAccessibility !== 'none';
      const fixAccessibility: FixAccessibility = usesPublic
        ? 'public'
        : defaultAccessibility;
      const autoFix = autoFixOf(node, fixAccessibility, sourceCode);
      const name = memberName(target, sourceCode);
      const data = { name };
      const suggest = suggestionsOf(node, fixAccessibility, sourceCode);
      const report: TSESLint.ReportDescriptor<MessageIds> = {
        node: target,
        messageId: 'missingAccessibility',
        data,
        ...autoFix,
        suggest
      };

      context.report(report);
    };

    const listeners: TSESLint.RuleListener = {
      AccessorProperty: check,
      MethodDefinition: check,
      PropertyDefinition: check,
      TSAbstractAccessorProperty: check,
      TSAbstractMethodDefinition: check,
      TSAbstractPropertyDefinition: check,
      TSParameterProperty: check
    };

    return listeners;
  }
});
