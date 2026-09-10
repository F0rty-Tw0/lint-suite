import { ESLintUtils } from '@typescript-eslint/utils';
import type {
  ParserServicesWithTypeInformation,
  TSESLint
} from '@typescript-eslint/utils';

import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';
import { compileGlobs } from '@lint-suite/rule-internals/utils/glob-matcher.util.ts';
import { defaultOptions, meta } from './common/no-unused-exports.const.ts';
import type {
  MessageIds,
  Options,
  RuleContext
} from './common/no-unused-exports.type.ts';
import { reportUnusedExports } from './report-unused-exports.ts';

const createRule = ESLintUtils.RuleCreator(
  () =>
    'https://github.com/F0rty-Tw0/lint-suite/tree/master/packages/eslint-plugin/no-unused-exports#readme'
);

const typedParserServices = (
  context: RuleContext
): ParserServicesWithTypeInformation | undefined => {
  try {
    const services = ESLintUtils.getParserServices(context, true);

    if (!services.program) return undefined;

    return services;
  } catch {
    return undefined;
  }
};

const ENTRY_POINT_MATCHERS = new WeakMap<string[], GlobMatcher>();

const entryPointMatcher = (entryPoints: string[]): GlobMatcher => {
  const cached = ENTRY_POINT_MATCHERS.get(entryPoints);

  if (cached) return cached;

  const matcher = compileGlobs(entryPoints);

  ENTRY_POINT_MATCHERS.set(entryPoints, matcher);

  return matcher;
};

export default createRule<Options, MessageIds>({
  name: 'no-unused-exports',
  meta,
  defaultOptions,
  create(context, [{ entryPoints }]): TSESLint.RuleListener {
    const noListeners: TSESLint.RuleListener = {};
    const isEntry = entryPointMatcher(entryPoints);
    const isEntryFile = isEntry(context.filename);

    if (isEntryFile) return noListeners;

    const services = typedParserServices(context);

    if (!services) return noListeners;

    const listeners: TSESLint.RuleListener = {
      Program(node): void {
        reportUnusedExports({ context, isEntry, node, services });
      }
    };

    return listeners;
  }
});
