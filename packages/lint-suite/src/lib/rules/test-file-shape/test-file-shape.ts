import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Options = [];
type MessageIds = 'forbiddenTestFile' | 'stubName' | 'stubType';

type ForbiddenShape = {
  readonly pattern: RegExp;
  readonly shape: string;
};

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Restrict test-support file shapes and enforce naming and typing on stub exports'
};

const messages: Record<MessageIds, string> = {
  forbiddenTestFile:
    "Test-support file shape '{{ shape }}' is not allowed; export a named stub from common/stubs/*.stub.ts instead.",
  stubName:
    "Stub export '{{ name }}' must be named in SCREAMING_SNAKE_CASE ending in '_STUB'.",
  stubType: "Stub export '{{ name }}' is missing an explicit type annotation."
};

const meta: ESLintUtils.NamedCreateRuleMeta<MessageIds, unknown, Options> = {
  type: 'problem',
  docs,
  schema: [],
  messages
};

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#test-file-shape'
);

const FORBIDDEN_SHAPES: ForbiddenShape[] = [
  { pattern: /\.spec-support\.ts$/, shape: '.spec-support.ts' },
  { pattern: /\.spec-helper\.ts$/, shape: '.spec-helper.ts' },
  { pattern: /\.test-utils\.ts$/, shape: '.test-utils.ts' },
  { pattern: /-fixture\.ts$/, shape: '-fixture.ts' },
  { pattern: /\/__mocks__\//, shape: '__mocks__/' },
  { pattern: /\/helpers\//, shape: 'helpers/' }
];

const STUB_FILE_PATTERN = /\/common\/stubs\/[^/]+\.stub\.ts$/;
const STUB_NAME_PATTERN = /^[A-Z0-9]+(_[A-Z0-9]+)*_STUB$/;

const forbiddenShape = (filename: string): string | undefined => {
  const match = FORBIDDEN_SHAPES.find((entry) => entry.pattern.test(filename));

  return match?.shape;
};

const isStubIdentifier = (
  id: TSESTree.VariableDeclarator['id']
): id is TSESTree.Identifier => id.type === TSESTree.AST_NODE_TYPES.Identifier;

const forbiddenTestFileListeners = (
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
  shape: string
): TSESLint.RuleListener => {
  const listeners: TSESLint.RuleListener = {
    Program(node): void {
      const data = { shape };
      const report: TSESLint.ReportDescriptor<MessageIds> = {
        node,
        messageId: 'forbiddenTestFile',
        data
      };

      context.report(report);
    }
  };

  return listeners;
};

const checkStubDeclarator = (
  context: Readonly<TSESLint.RuleContext<MessageIds, Options>>,
  node: TSESTree.VariableDeclarator
): void => {
  const fallbackName = context.sourceCode.getText(node.id);
  const name = isStubIdentifier(node.id) ? node.id.name : fallbackName;
  const hasValidPattern = STUB_NAME_PATTERN.test(name);
  const hasValidName = isStubIdentifier(node.id) && hasValidPattern;

  if (!hasValidName) {
    const nameData = { name };
    const nameReport: TSESLint.ReportDescriptor<MessageIds> = {
      node: node.id,
      messageId: 'stubName',
      data: nameData
    };

    context.report(nameReport);
  }

  const hasTypeAnnotation = node.id.typeAnnotation !== undefined;

  if (hasTypeAnnotation) return;

  const typeData = { name };
  const typeReport: TSESLint.ReportDescriptor<MessageIds> = {
    node: node.id,
    messageId: 'stubType',
    data: typeData
  };

  context.report(typeReport);
};

export default createRule<Options, MessageIds>({
  name: 'test-file-shape',
  meta,
  defaultOptions: [],
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const shape = forbiddenShape(filename);

    if (shape) return forbiddenTestFileListeners(context, shape);

    const isStubFile = STUB_FILE_PATTERN.test(filename);

    if (!isStubFile) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const stubListeners: TSESLint.RuleListener = {
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator'(
        node: TSESTree.VariableDeclarator
      ): void {
        checkStubDeclarator(context, node);
      }
    };

    return stubListeners;
  }
});
