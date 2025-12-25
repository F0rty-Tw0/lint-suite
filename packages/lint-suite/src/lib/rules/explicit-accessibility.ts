import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  () => 'https://eslint.org/docs/latest/rules/no-unused-private-class-members'
);

type AccessibilityLevel = 'public' | 'private' | 'protected';

type Options = [
  {
    defaultAccessibility?: AccessibilityLevel;
  }
];

const defaultOptions: Options[0] = {
  defaultAccessibility: 'private'
};

const getNodeName = (
  node: TSESTree.Node | TSESTree.Token | null | undefined
): string => {
  if (!node) {
    return '<unknown>';
  }

  /*
   * MethodDefinition or PropertyDefinition (check 'key' first)
   * Note: Check 'key' before 'kind' because MethodDefinition has both
   */
  if ('key' in node && node.key) {
    if (node.key.type === TSESTree.AST_NODE_TYPES.Identifier) {
      return node.key.name;
    }
    // Handle computed property names, private identifiers (#name), etc. if needed
    if (node.key.type === TSESTree.AST_NODE_TYPES.PrivateIdentifier) {
      return `#${node.key.name}`;
    }
    return '<computed/complex key>';
  }

  // Constructor specific check (if key check didn't catch it - unlikely for MethodDefinition)
  if ('kind' in node && node.kind === 'constructor') {
    return 'constructor';
  }

  // TSParameterProperty - handle its 'parameter' property
  if (node.type === TSESTree.AST_NODE_TYPES.TSParameterProperty) {
    const param = node.parameter; // Assign to variable for clarity & potentially better inference

    // Handle different parameter kinds:
    if (param.type === TSESTree.AST_NODE_TYPES.Identifier) {
      return param.name;
    }
    if (param.type === TSESTree.AST_NODE_TYPES.AssignmentPattern) {
      // Check the left side of the assignment
      if (param.left.type === TSESTree.AST_NODE_TYPES.Identifier) {
        return param.left.name; // Name is on the identifier being assigned to
      }
      /*
       * Parameter is an assignment pattern with destructuring (ArrayPattern/ObjectPattern)
       * You might want more sophisticated logic here to extract a name
       */
      return '<destructured parameter>';
    }
    // Handle other potential kinds like RestElement ([...args]), ArrayPattern, ObjectPattern

    return '<complex parameter>';
  }

  return '<unknown>';
};

export default createRule<Options, 'missingAccessibility'>({
  name: 'explicit-accessibility',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require explicit accessibility modifiers on class members'
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          defaultAccessibility: {
            type: 'string',
            enum: ['public', 'private', 'protected'],
            description: 'The accessibility modifier to add if one is missing.'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingAccessibility:
        "Class member '{{ name }}' is missing an explicit accessibility modifier (public/private/protected)."
    }
  },
  defaultOptions: [defaultOptions],

  create(context, [options]) {
    const { defaultAccessibility } = { ...defaultOptions, ...options };
    const sourceCode = context.sourceCode;

    function checkNode(
      node:
        | TSESTree.MethodDefinition
        | TSESTree.PropertyDefinition
        | TSESTree.TSParameterProperty
    ): void {
      if (node.accessibility) {
        return; // Already has modifier
      }

      let reportNode: TSESTree.Node | TSESTree.Token = node;
      const name = getNodeName(node);
      // Adjust report node for better highlighting
      if (
        node.type === TSESTree.AST_NODE_TYPES.MethodDefinition ||
        node.type === TSESTree.AST_NODE_TYPES.PropertyDefinition
      ) {
        reportNode = node.key;
      } else {
        const param = node.parameter;
        if (param.type === TSESTree.AST_NODE_TYPES.Identifier) {
          reportNode = param;
        } else if (
          param.type === TSESTree.AST_NODE_TYPES.AssignmentPattern &&
          param.left.type === TSESTree.AST_NODE_TYPES.Identifier
        ) {
          reportNode = param.left;
        }
        // Keep reportNode as the TSParameterProperty node itself if param isn't simple identifier
      }

      context.report({
        node: reportNode,
        messageId: 'missingAccessibility',
        data: { name },
        fix(fixer) {
          let tokenToInsertBefore: TSESTree.Token | null = null;
          let insertText = `${defaultAccessibility} `;

          if (node.decorators.length > 0) {
            const lastDecorator = node.decorators[node.decorators.length - 1];
            tokenToInsertBefore = sourceCode.getTokenAfter(lastDecorator);
          } else {
            tokenToInsertBefore = sourceCode.getFirstToken(node);
          }

          // Parameter properties need special handling if they also have 'readonly'
          if (
            node.type === TSESTree.AST_NODE_TYPES.TSParameterProperty &&
            node.readonly
          ) {
            // If readonly exists without accessibility, insert accessibility *before* readonly
            const firstToken = sourceCode.getFirstToken(node);
            if (firstToken?.value === 'readonly') {
              // double check it's the readonly token
              tokenToInsertBefore = firstToken;
            }
            // If insertion point wasn't decorators, use first token (which should be readonly)
          }

          if (!tokenToInsertBefore) return null;

          /*
           * If the token immediately after the insertion point isn't whitespace, add a space.
           * (Handles case where tokenToInsertBefore is the last decorator token)
           */
          const tokenAfterInsertion = sourceCode.getTokenAfter(
            tokenToInsertBefore,
            { includeComments: false }
          );
          const textBetween = sourceCode.text.slice(
            tokenToInsertBefore.range[1],
            tokenAfterInsertion?.range[0]
          );
          if (!/^\s/.test(textBetween)) {
            insertText = ` ${insertText}`; // Add leading space if needed after decorator
          }

          return fixer.insertTextBefore(tokenToInsertBefore, insertText);
        }
      });
    }

    return {
      MethodDefinition(node: TSESTree.MethodDefinition): void {
        checkNode(node);
      },

      PropertyDefinition(node: TSESTree.PropertyDefinition): void {
        checkNode(node);
      },

      TSParameterProperty(node: TSESTree.TSParameterProperty): void {
        checkNode(node);
      }
    };
  }
});
