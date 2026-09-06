import type { TmplAstElement } from '@angular/compiler';

import { ESLintUtils } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

import type {
  MessageIds,
  RuleOptions,
  TemplateParserServices
} from './common/no-unstyled-classes.type.ts';
import { templateStylesheets } from './styles/template-stylesheets.ts';
import { templateClasses } from '../utils/template-classes.util.ts';
import { toRegExp } from '../utils/to-regexp.util.ts';

type Options = [RuleOptions];

const PARSER_REQUIRED =
  "no-unstyled-classes requires '@angular-eslint/template-parser'.";

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Disallow template class names that no stylesheet of the component selects'
};

const messages: Record<MessageIds, string> = {
  unstyledClass:
    "Class '{{name}}' is not selected by any stylesheet of this template."
};

const stringItems: JSONSchema.JSONSchema4 = { type: 'string' };

const ignoreClassPatternsSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringItems,
  description: 'Regular expressions for class names that are never reported.'
};

const globalStylesSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: stringItems,
  description: 'Stylesheets merged into the known classes of every template.'
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  ignoreClassPatterns: ignoreClassPatternsSchema,
  globalStyles: globalStylesSchema
};

const optionsSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties,
  additionalProperties: false
};

const schema: JSONSchema.JSONSchema4[] = [optionsSchema];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'problem',
  docs,
  schema,
  messages
};

const ruleDefaults: RuleOptions = {
  ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-'],
  globalStyles: []
};

const defaultOptions: Options = [ruleDefaults];

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#no-unstyled-classes'
);

const isTemplateServices = (
  services: object
): services is TemplateParserServices => {
  if (!('convertNodeSourceSpanToLoc' in services)) return false;

  return typeof services.convertNodeSourceSpanToLoc === 'function';
};

export default createRule<Options, MessageIds>({
  name: 'no-unstyled-classes',
  meta,
  defaultOptions,
  create(context, [options]): TSESLint.RuleListener {
    const { parserServices } = context.sourceCode;

    if (parserServices === undefined) throw new Error(PARSER_REQUIRED);

    if (!isTemplateServices(parserServices)) throw new Error(PARSER_REQUIRED);

    const ignored = options.ignoreClassPatterns.map(toRegExp);
    const stylesheets = templateStylesheets(
      context.filename,
      context.sourceCode.text,
      context.cwd,
      options.globalStyles
    );
    const listeners: TSESLint.RuleListener = {
      Element(node: TmplAstElement): void {
        const isCustomElement = node.name.includes('-');

        if (isCustomElement) return;

        const classes = templateClasses(node);

        if (classes.length === 0) return;

        const known = stylesheets();

        if (known.size === 0) return;

        for (const { name, span } of classes) {
          const isIgnored = ignored.some((pattern) => pattern.test(name));

          if (isIgnored) continue;

          const isStyled = known.has(name);

          if (isStyled) continue;

          const loc = parserServices.convertNodeSourceSpanToLoc(span);
          const data = { name };
          const report: TSESLint.ReportDescriptor<MessageIds> = {
            loc,
            messageId: 'unstyledClass',
            data
          };

          context.report(report);
        }
      }
    };

    return listeners;
  }
});
