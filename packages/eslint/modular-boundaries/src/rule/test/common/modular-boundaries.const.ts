import type {
  DepConstraint,
  RuleOptions
} from '../../common/modular-boundaries.type.ts';

export const BENCHMARK_PROJECT_COUNT = 500;

export const BENCHMARK_FILES_PER_PROJECT = 100;

export const FEATURE_FILE_PATH = 'packages/feature/src/a.ts';

export const IMPORT_DATA = "import { data } from '@ws/data';";

export const IMPORT_UI = "import { ui } from '@ws/ui';";

export const IMPORT_UTIL = "import { util } from '@acme/util';";

export const IMPORT_B = "import { b } from '@c/b';";

const onlyUiConstraint: DepConstraint = {
  sourceTag: 'type:feature',
  onlyDependOnLibsWithTags: ['type:ui']
};

const onlyUiConstraints: DepConstraint[] = [onlyUiConstraint];

export const ONLY_UI_OPTIONS: RuleOptions = {
  depConstraints: onlyUiConstraints
};
