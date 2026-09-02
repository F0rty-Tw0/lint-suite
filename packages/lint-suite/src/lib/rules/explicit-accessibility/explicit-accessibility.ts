import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

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

const accessibilities: readonly Accessibility[] = [
  'public',
  'private',
  'protected'
];

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#explicit-accessibility'
);

const isPrivateMember = (node: Member): boolean =>
  node.type !== TSESTree.AST_NODE_TYPES.TSParameterProperty &&
  node.key.type === TSESTree.AST_NODE_TYPES.PrivateIdentifier;

const isConstructor = (node: Member): boolean =>
  node.type === TSESTree.AST_NODE_TYPES.MethodDefinition &&
  node.kind === 'constructor';

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
): string =>
  target.type === TSESTree.AST_NODE_TYPES.Identifier
    ? target.name
    : sourceCode.getText(target);

const insertModifier = (
  node: Member,
  accessibility: Accessibility,
  sourceCode: TSESLint.SourceCode
): Fix => {
  const lastDecorator = node.decorators.at(-1);
  const token = lastDecorator
    ? sourceCode.getTokenAfter(lastDecorator)
    : sourceCode.getFirstToken(node);

  if (!token) {
    return () => null;
  }

  const adjacentToDecorator = lastDecorator?.range[1] === token.range[0];
  const text = `${adjacentToDecorator ? ' ' : ''}${accessibility} `;

  return (fixer) => fixer.insertTextBefore(token, text);
};

export default createRule<Options, MessageIds>({
  name: 'explicit-accessibility',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require explicit accessibility modifiers on class members'
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          defaultAccessibility: {
            type: 'string',
            enum: ['public', 'private', 'protected', 'none'],
            description:
              "The accessibility modifier inserted by the auto-fix; constructors always get public. 'none' reports without an auto-fix and offers all three levels as suggestions."
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingAccessibility:
        "Class member '{{ name }}' is missing an explicit accessibility modifier (public/private/protected).",
      setAccessibility: "Add the '{{ accessibility }}' modifier."
    }
  },
  defaultOptions: [{ defaultAccessibility: 'public' }],
  create(context, [{ defaultAccessibility = 'public' }]) {
    const { sourceCode } = context;

    const check = (node: Member): void => {
      if (node.accessibility || isPrivateMember(node)) {
        return;
      }

      const target = reportTarget(node);
      const fixAccessibility: FixAccessibility =
        isConstructor(node) && defaultAccessibility !== 'none'
          ? 'public'
          : defaultAccessibility;

      context.report({
        node: target,
        messageId: 'missingAccessibility',
        data: { name: memberName(target, sourceCode) },
        ...(fixAccessibility === 'none'
          ? {}
          : { fix: insertModifier(node, fixAccessibility, sourceCode) }),
        suggest: accessibilities
          .filter((accessibility) => accessibility !== fixAccessibility)
          .map((accessibility) => ({
            messageId: 'setAccessibility',
            data: { accessibility },
            fix: insertModifier(node, accessibility, sourceCode)
          }))
      });
    };

    return {
      AccessorProperty: check,
      MethodDefinition: check,
      PropertyDefinition: check,
      TSAbstractAccessorProperty: check,
      TSAbstractMethodDefinition: check,
      TSAbstractPropertyDefinition: check,
      TSParameterProperty: check
    };
  }
});
