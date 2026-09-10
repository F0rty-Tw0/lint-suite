import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { RuleTester } from 'eslint';

export type Accessibility = 'private' | 'protected' | 'public';

export type FixAccessibility = Accessibility | 'none';

type AccessibilityOptions = {
  readonly defaultAccessibility?: FixAccessibility;
};

export type Options = [AccessibilityOptions];

export type MessageIds = 'missingAccessibility' | 'setAccessibility';

export type Member =
  | TSESTree.AccessorProperty
  | TSESTree.MethodDefinition
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractAccessorProperty
  | TSESTree.TSAbstractMethodDefinition
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.TSParameterProperty;

export type Fix = (fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null;

export type AutoFix = { readonly fix?: Fix };

export type MemberCase = Omit<RuleTester.InvalidTestCase, 'name'>;
