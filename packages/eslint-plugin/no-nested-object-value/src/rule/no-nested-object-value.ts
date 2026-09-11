import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';
import { compileGlobs } from '@lint-suite/rule-internals/utils/glob-matcher.util.ts';
import { defaultOptions, meta } from './common/no-nested-object-value.const.ts';
import type {
  MessageIds,
  Options
} from './common/no-nested-object-value.type.ts';
import { isInsideDecoratorConfig } from './utils/decorator-config.util.ts';
import { enclosingStatement } from '@lint-suite/rule-internals/utils/enclosing-statement.util.ts';
import { indentOf } from '@lint-suite/rule-internals/utils/indent-of.util.ts';

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/no-nested-object-value#readme'
);

const isChainedCall = (node: TSESTree.CallExpression): boolean => {
  const { callee } = node;

  if (callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression) return false;

  return callee.object.type === TSESTree.AST_NODE_TYPES.CallExpression;
};

const isObjectElement = (
  element: TSESTree.ArrayExpression['elements'][number]
): boolean => {
  return element?.type === TSESTree.AST_NODE_TYPES.ObjectExpression;
};

const hasNestedObjectElement = (node: TSESTree.ArrayExpression): boolean => {
  return node.elements.some(isObjectElement);
};

const isNestedValue = (value: TSESTree.Property['value']): boolean => {
  if (value.type === TSESTree.AST_NODE_TYPES.ObjectExpression) {
    return value.properties.length > 0;
  }

  if (value.type === TSESTree.AST_NODE_TYPES.ArrayExpression) {
    return hasNestedObjectElement(value);
  }

  if (value.type === TSESTree.AST_NODE_TYPES.ConditionalExpression) return true;

  if (value.type === TSESTree.AST_NODE_TYPES.CallExpression) {
    return isChainedCall(value);
  }

  return false;
};

const CONFIG_FILE_MATCHERS = new WeakMap<string[], GlobMatcher>();

const configFileMatcher = (configFiles: string[]): GlobMatcher => {
  const cached = CONFIG_FILE_MATCHERS.get(configFiles);

  if (cached) return cached;

  const matcher = compileGlobs(configFiles);

  CONFIG_FILE_MATCHERS.set(configFiles, matcher);

  return matcher;
};

const isConfigFile = (filename: string, configFiles: string[]): boolean => {
  const matchesConfig = configFileMatcher(configFiles);

  return matchesConfig(filename);
};

const suggestionsFor = (
  property: TSESTree.Property,
  key: string,
  sourceCode: TSESLint.SourceCode
): TSESLint.SuggestionReportDescriptor<MessageIds>[] => {
  const empty: TSESLint.SuggestionReportDescriptor<MessageIds>[] = [];
  const isNamedKey =
    property.key.type === TSESTree.AST_NODE_TYPES.Identifier &&
    !property.computed;

  if (!isNamedKey) return empty;

  const statement = enclosingStatement(property);
  const indent = indentOf(statement, sourceCode);
  const valueText = sourceCode.getText(property.value);
  const fix: TSESLint.ReportFixFunction = (fixer) => {
    const declaration = fixer.insertTextBefore(
      statement,
      `const ${key} = ${valueText};\n${indent}`
    );
    const replaced = fixer.replaceText(property.value, key);
    const fixes = [declaration, replaced];

    return fixes;
  };
  const data = { key };
  const suggestion: TSESLint.SuggestionReportDescriptor<MessageIds> = {
    messageId: 'nestedValue',
    data,
    fix
  };

  const suggestions: TSESLint.SuggestionReportDescriptor<MessageIds>[] = [
    suggestion
  ];

  return suggestions;
};

export default createRule<Options, MessageIds>({
  name: 'no-nested-object-value',
  meta,
  defaultOptions,
  create(context, [{ configFiles }]) {
    const isExemptFile = isConfigFile(context.filename, configFiles);

    if (isExemptFile) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const { sourceCode } = context;

    const listeners: TSESLint.RuleListener = {
      Property(node): void {
        if (node.parent.type !== TSESTree.AST_NODE_TYPES.ObjectExpression)
          return;

        const isNested = isNestedValue(node.value);

        if (!isNested) return;

        const ancestors = sourceCode.getAncestors(node.parent);
        const isDecoratorConfig = isInsideDecoratorConfig(
          node.parent,
          ancestors
        );

        if (isDecoratorConfig) return;

        const key = sourceCode.getText(node.key);
        const suggest = suggestionsFor(node, key, sourceCode);
        const data = { key };
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'nestedValue',
          data,
          suggest
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
