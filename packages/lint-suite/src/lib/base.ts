import nx from '@nx/eslint-plugin';
import type { Linter } from 'eslint';

export const base: Linter.Config[] = [...nx.configs['flat/base']];
