import { existsSync, readdirSync } from 'node:fs';
import { posix } from 'node:path';

import { ESLintUtils } from '@typescript-eslint/utils';
import type { JSONSchema, TSESLint } from '@typescript-eslint/utils';

import type { GlobMatcher } from '../common/glob-matcher.type.ts';
import { compileGlobs } from '../utils/glob-matcher.util.ts';

type SiblingSpecOptions = { readonly exempt: string[] };
type Options = [SiblingSpecOptions];
type MessageIds = 'missingSpec';

const docs: TSESLint.RuleMetaDataDocs = {
  description:
    'Require a same-directory *.spec.ts (or <name>.<group>.spec.ts) sibling for every source file'
};

const messages: Record<MessageIds, string> = {
  missingSpec:
    "No sibling spec found; expected '{{ spec }}' or '<name>.<group>.spec.ts'."
};

const exemptItems: JSONSchema.JSONSchema4 = { type: 'string' };

const exemptSchema: JSONSchema.JSONSchema4 = {
  type: 'array',
  items: exemptItems
};

const properties: Record<string, JSONSchema.JSONSchema4> = {
  exempt: exemptSchema
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

const createRule = ESLintUtils.RuleCreator(
  () => 'https://github.com/F0rty-Tw0/lint-suite#sibling-spec'
);

const DEFAULT_EXEMPT: string[] = [
  '**/main.ts',
  '**/*.config.ts',
  '**/*.routes.ts',
  '**/*.stories.ts',
  '**/index.ts',
  '**/environment*.ts',
  '**/test-setup*.ts'
];

const defaultOptions: Options = [{ exempt: DEFAULT_EXEMPT }];

const EXEMPT_SUFFIX = /\.(spec|spec\.util|stub|type|const|d)\.ts$/;
const REGEXP_META = /[.*+?^${}()|[\]\\]/gu;

const EXEMPT_MATCHERS = new WeakMap<string[], GlobMatcher>();

const escapeRegExp = (value: string): string =>
  value.replaceAll(REGEXP_META, '\\$&');

const exemptMatcher = (exempt: string[]): GlobMatcher => {
  const cached = EXEMPT_MATCHERS.get(exempt);

  if (cached) return cached;

  const matcher = compileGlobs(exempt);

  EXEMPT_MATCHERS.set(exempt, matcher);

  return matcher;
};

const isExempt = (filename: string, exempt: string[]): boolean => {
  const hasExemptSuffix = EXEMPT_SUFFIX.test(filename);

  if (hasExemptSuffix) return true;

  const isFixture = filename.includes('/fixtures/');

  if (isFixture) return true;

  const isUnderTestDirectory = filename.includes('/test/');
  const isUnderTestingDirectory = filename.includes('/testing/');

  if (isUnderTestDirectory || isUnderTestingDirectory) return true;

  const isTypeScriptFile = filename.endsWith('.ts');

  if (!isTypeScriptFile) return true;

  const matchesExempt = exemptMatcher(exempt);

  return matchesExempt(filename);
};

const hasIntegrationSpec = (directory: string, base: string): boolean => {
  const pattern = new RegExp(
    `^${escapeRegExp(base)}\\.[^.]+\\.spec\\.ts$`,
    'u'
  );

  try {
    return readdirSync(directory).some((entry) => pattern.test(entry));
  } catch {
    return true;
  }
};

const hasSiblingSpec = (filename: string): boolean => {
  const directory = posix.dirname(filename);
  const base = posix.basename(filename, '.ts');
  const specPath = posix.join(directory, `${base}.spec.ts`);
  const hasDirectSpec = existsSync(specPath);

  if (hasDirectSpec) return true;

  return hasIntegrationSpec(directory, base);
};

export default createRule<Options, MessageIds>({
  name: 'sibling-spec',
  meta,
  defaultOptions,
  create(context, [{ exempt }]) {
    const filename = context.filename.replaceAll('\\', '/');
    const exemptFile = isExempt(filename, exempt);

    if (exemptFile) {
      const noListeners: TSESLint.RuleListener = {};

      return noListeners;
    }

    const listeners: TSESLint.RuleListener = {
      Program(node): void {
        const hasSpec = hasSiblingSpec(filename);

        if (hasSpec) return;

        const spec = `${posix.basename(filename, '.ts')}.spec.ts`;
        const data = { spec };
        const report: TSESLint.ReportDescriptor<MessageIds> = {
          node,
          messageId: 'missingSpec',
          data
        };

        context.report(report);
      }
    };

    return listeners;
  }
});
