import nx from '@nx/eslint-plugin';

export const angular = [
  ...nx.configs['flat/angular'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error'
    }
  }
];
