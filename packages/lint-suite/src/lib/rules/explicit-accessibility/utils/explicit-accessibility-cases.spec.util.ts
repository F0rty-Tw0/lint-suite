import type { RuleTester } from 'eslint';

type Accessibility = 'private' | 'protected' | 'public';
type FixAccessibility = Accessibility | 'none';
type Render = (modifier: string) => string;
type MemberOptions = { readonly defaultAccessibility: FixAccessibility };
type MemberCase = Omit<RuleTester.InvalidTestCase, 'name'>;

const accessibilities: readonly Accessibility[] = [
  'public',
  'private',
  'protected'
];

export const inClass = (render: Render, abstract = false): Render => {
  const keyword = abstract ? 'abstract class' : 'class';

  return (modifier) => `${keyword} A { ${render(modifier)} }`;
};

export const suggestion = (
  accessibility: Accessibility,
  output: string
): RuleTester.SuggestionOutput => {
  const data = { accessibility };
  const setAccessibility: RuleTester.SuggestionOutput = {
    messageId: 'setAccessibility',
    data,
    output
  };

  return setAccessibility;
};

export const accessibilityError = (
  name: string,
  suggestions: RuleTester.SuggestionOutput[]
): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = {
    messageId: 'missingAccessibility',
    data,
    suggestions
  };

  return error;
};

const ruleOptionsOf = (options?: MemberOptions): MemberOptions[] => {
  if (!options) return [];

  return [options];
};

const otherSuggestions = (
  render: Render,
  fixAccessibility: FixAccessibility
): RuleTester.SuggestionOutput[] => {
  const isOther = (accessibility: Accessibility): boolean => {
    return accessibility !== fixAccessibility;
  };

  const suggestionOf = (
    accessibility: Accessibility
  ): RuleTester.SuggestionOutput => {
    const output = render(`${accessibility} `);

    return suggestion(accessibility, output);
  };

  return accessibilities.filter(isOther).map(suggestionOf);
};

export const member = (
  name: string,
  render: Render,
  options?: MemberOptions,
  fixAccessibility: FixAccessibility = options?.defaultAccessibility ?? 'public'
): MemberCase => {
  const code = render('');
  const ruleOptions = ruleOptionsOf(options);
  const fixedCode = render(`${fixAccessibility} `);
  const output = fixAccessibility === 'none' ? null : fixedCode;
  const suggestions = otherSuggestions(render, fixAccessibility);
  const error = accessibilityError(name, suggestions);
  const errors = [error];
  const testCase: MemberCase = {
    code,
    options: ruleOptions,
    output,
    errors
  };

  return testCase;
};
