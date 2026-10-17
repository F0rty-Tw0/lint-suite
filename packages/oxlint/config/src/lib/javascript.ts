import globals from 'globals';
import type { OxlintConfig } from 'oxlint';

import { javascriptRecommended } from './javascript-recommended.ts';
import { JS_FILES } from '../common/file-globs.const.ts';
import { toOxlintGlobals } from '../utils/oxlint-globals.util.ts';

const environment = { ...globals.browser, ...globals.node };
const environmentGlobals = toOxlintGlobals(environment);

export const javascript: OxlintConfig = {
  categories: { correctness: 'off' },
  extends: [javascriptRecommended],
  overrides: [{ files: JS_FILES, globals: environmentGlobals }]
};
