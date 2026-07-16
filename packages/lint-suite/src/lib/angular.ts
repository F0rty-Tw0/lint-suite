import globals from 'globals';
import { configs, processInlineTemplates } from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import type { Config } from 'eslint/config';

export const angular = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [...(configs.tsRecommended as Config[])],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node
      }
    },
    processor: processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error', // v22: flags only explicit opt-out of OnPush (omission now means OnPush)
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/no-implicit-take-until-destroyed': 'error', // v21.2.0: Enforce explicit DestroyRef
      '@angular-eslint/no-async-lifecycle-method': 'error', // Prevent async lifecycle hooks
      '@angular-eslint/prefer-output-readonly': 'warn', // Prevent accidental reassignment
      '@angular-eslint/prefer-output-emitter-ref': 'warn', // Modern output() function over @Output()
      '@angular-eslint/sort-lifecycle-methods': 'warn', // Consistent lifecycle method ordering
      '@angular-eslint/computed-must-return': 'error', // Catch silent computed() bugs missing a return
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error', // Catch duplicate imports/providers in @Component/@NgModule
      '@angular-eslint/no-lifecycle-call': 'error', // Forbid manual this.ngOnInit() calls
      '@angular-eslint/require-lifecycle-on-prototype': 'error', // Lifecycle hooks must be methods, not arrow-fn fields
      '@angular-eslint/relative-url-prefix': 'error', // Require ./ in templateUrl/styleUrl for portability
      '@angular-eslint/use-component-selector': 'error', // All components must declare a selector
      '@angular-eslint/no-developer-preview': 'warn', // Flag APIs marked @developerPreview (no breaking-change policy)
      '@angular-eslint/no-experimental': 'warn' // Flag APIs marked @experimental
    }
  }
]);
