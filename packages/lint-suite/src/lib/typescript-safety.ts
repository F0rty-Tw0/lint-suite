import { defineConfig } from 'eslint/config';

import { MAX_LINE_LENGTH } from './line-length.const.ts';
import { localPlugin } from './typescript-local-plugin.ts';

export const typescriptSafety = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    plugins: { local: localPlugin },
    rules: {
      // Expression arrow whose body wraps gets a block body. Fixes.
      // Bad: (x) => a &&  b on two lines   Good: (x) => { return a && b; }
      'local/arrow-body-fits-line': 'error',
      // Two or more calls in one chain stay on one line.
      // Bad: a .b() .c() over three lines   Good: const b = a.b(); b.c();
      'local/chain-fits-line': 'error',
      // A member chain starts on a name, never on an inline expression.
      // Bad: (a ?? b).c   Good: const ab = a ?? b; ab.c
      'local/chain-receiver-is-name': 'error',
      // Every class member states public, private, or protected. Fixes.
      // Bad: field = 1;   Good: private field = 1;
      'local/explicit-accessibility': 'error',
      // An if condition holds at most 3 operands joined by && or ||.
      // Bad: if (a && b && c && d)   Good: const isAll = a && b && c && d;
      'local/max-condition-operands': 'error',
      // No call inside an if; type predicates and this.x() reads are exempt.
      // Bad: if (validate(o))   Good: const isValid = validate(o); if (isValid)
      'local/no-call-in-condition': 'error',
      // No parenthesised group with a different operator inside an if.
      // Bad: if (a && (b || c))   Good: const isBOrC = b || c; if (a && isBOrC)
      'local/no-grouped-condition': 'error',
      // An object type literal appears only as the body of a type alias.
      // Bad: (f: { a: string })   Good: type F = { a: string }; (f: F)
      'local/no-inline-object-types': 'error',
      // Never return an object literal inline; name it first.
      // Bad: return { a: 1 };   Good: const result = { a: 1 }; return result;
      'local/no-inline-return-object': 'error',
      // A nested object, array of objects, ternary, or chain as a value gets a
      // name.
      // Bad: { a: { b: 1 } }   Good: const a = { b: 1 }; { a }
      'local/no-nested-object-value': 'error',
      // Spread only a name or a member access.
      // Bad: f(...getArgs())   Good: const args = getArgs(); f(...args)
      'local/no-spread-expression': 'error',
      // An export no file in the program imports is dead; entry points exempt.
      // Bad: export const unused = 1;   Good: delete it, or import it
      'local/no-unused-exports': 'error',
      // A lone return/throw/continue/break guard drops braces when it fits.
      // Bad: braced three-line if (x) { return; }   Good: if (x) return;
      'local/one-line-guard': ['error', { maxLineLength: MAX_LINE_LENGTH }],
      // Type properties are readonly; arrays stay T[], never readonly T[].
      // Fixes.
      // Bad: { id: string; items: readonly T[] }
      // Good: { readonly id: string; readonly items: T[] }
      'local/readonly-type-properties': 'error',
      // A ternary branch is a name, literal, or plain member access.
      // Bad: c ? foo() : b   Good: const called = foo(); c ? called : b
      'local/ternary-branch-shape': 'error',
      // No spec-support, helpers, or __mocks__ files; stubs, mocks, and
      // spec utils live under test/; stubs are UPPER_SNAKE_STUB: Type.
      // Bad: user.spec-helper.ts, common/stubs/user.stub.ts
      // Good: test/utils/user.spec.util.ts, test/stubs USER_STUB: User
      'local/test-file-shape': 'error',
      // Exported types live in common/*.type.ts; type-only imports come from
      // there.
      // Bad: export type Order in order.ts
      // Good: export type Order in common/order.type.ts
      'local/type-placement': 'error',
      // utils/*.util.ts hold pure code: no fs, process, Date.now, module-level
      // let or Map. Files under test/ or testing/ are exempt.
      // Bad: const cache = new Map(); at module level
      // Good: pass the state in as an argument
      'local/util-purity': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/parameter-properties': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration[declare!=true]',
          message:
            'enum is not erasable syntax; use a union of literals or an as-const object.'
        },
        {
          selector: 'TSModuleDeclaration[kind="namespace"][declare!=true]',
          message: 'namespace is not erasable syntax; use a module.'
        }
      ],
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-use-before-define': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true }
      ],
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-array-delete': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true }
      ],
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true }
      ],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true, ignoreVoidOperator: true }
      ],
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true }
      ],
      '@typescript-eslint/no-invalid-void-type': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-find': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-regexp-exec': 'error'
    }
  },
  {
    files: ['**/*.action.ts'],
    rules: {
      // Class actions carry their payload as constructor parameter properties.
      '@typescript-eslint/parameter-properties': 'off'
    }
  },
  {
    files: ['**/*.stub.ts'],
    rules: {
      // local/test-file-shape requires STUB: Type; a literal stub would trip
      // no-inferrable-types.
      '@typescript-eslint/no-inferrable-types': 'off'
    }
  }
]);
