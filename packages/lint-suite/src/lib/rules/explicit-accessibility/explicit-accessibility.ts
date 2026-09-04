import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

type Accessibility = 'private' | 'protected' | 'public';
type FixAccessibility = Accessibility | 'none';
type Options = [{ readonly defaultAccessibility?: FixAccessibility }];
type MessageIds = 'missingAccessibility' | 'setAccessibility';
type Member =
  | TSESTree.AccessorProperty
  | TSESTree.MethodDefinition
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractAccessorProperty
  | TSESTree.TSAbstractMethodDefinition
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.TSParameterProperty;
type Fix = (fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null;
type AutoFix = { readonly fix?: Fix };

const accessibilities: readonly Accessibility[] = [
  'public',
  'private',
  'protected'
];

const docs: TSESLint.RuleMetaDataDocs = {
  description: 'Require explicit accessibility modifiers on class members'
};

const messages: Record<MessageIds, string> = {
  missingAccessibility:
    "Class member '{{ name }}' is missing an explicit accessibility modifier (public/private/protected).",
  setAccessibility: "Add the '{{ accessibility }}' modifier."
};

const defaultAccessibilitySchema: JSONSchema.JSONSchema4 = {
  type: 'string',
  enum: ['public', 'private', 'protected', 'none'],
  description:
    "The accessibility modifier inserted by the auto-fix; constructors always get public. 'none' reports without an auto-fix and offers all three levels as suggestions."
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  defaultAccessibility: defaultAccessibilitySchema
};

const optionsSchema: JSONSchema.JSONSchema4 = {
  type: 'object',
  properties,
  additionalProperties: false
};

const schema: JSONSchema.JSONSchema4[] = [optionsSchema];

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'suggestion',
  docs,
  fixable: 'code',
  hasSuggestions: true,
  schema,
  messages
};

const defaultOptions: Options = [{ defaultAccessibility: 'public' }];

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

  if (
    parameter.type === TSESTree.AST_NODE_TYPES.AssignmentPattern &&
    parameter.left.type === TSESTree.AST_NODE_TYPES.Identifier
  ) {
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

      const suggestionFor = (
        accessibility: Accessibility
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

      const isOtherAccessibility = (accessibility: Accessibility): boolean => {
        return accessibility !== fixAccessibility;
      };

      const autoFix = autoFixOf(node, fixAccessibility, sourceCode);
      const name = memberName(target, sourceCode);
      const data = { name };
      const suggest = accessibilities
        .filter(isOtherAccessibility)
        .map(suggestionFor);
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
