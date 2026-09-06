import type { RuleTester } from 'eslint';

import {
  fixtureCase,
  fixtureFile
} from './utils/fixture-template.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester,
  unstyledClassError
} from './utils/rule-under-test.spec.util.ts';

const globalStyles = [fixtureFile('global', 'styles.scss')];
const globalOptions = [{ globalStyles }];
const replacedPatterns = [{ ignoreClassPatterns: ['^nope$'] }];
const widenedPatterns = [
  { ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^nope$'] }
];

const staticTokenError: RuleTester.TestCaseError = {
  ...unstyledClassError('unstyled-one'),
  line: 1,
  column: 40,
  endColumn: 52
};
const flatErrors = [staticTokenError, unstyledClassError('missing')];
const interpolationErrors = [
  unstyledClassError('icon'),
  unstyledClassError('nope')
];
const globalErrors = [
  unstyledClassError('global-one'),
  unstyledClassError('nope')
];
const expressionErrors = [
  unstyledClassError('lit-b'),
  unstyledClassError('map-c'),
  unstyledClassError('tern-b')
];
const prefixedErrors = [
  unstyledClassError('js-hook'),
  unstyledClassError('qa-thing'),
  unstyledClassError('mat-elevation-z2'),
  unstyledClassError('cdk-overlay'),
  unstyledClassError('mdc-button')
];
const missingClassErrors = [unstyledClassError('nope')];
const partialsErrors = [
  unstyledClassError('nope'),
  unstyledClassError('nope-two')
];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a template whose component declares no stylesheet',
    ...fixtureCase('no-stylesheet', 'plain.component.html')
  },
  {
    name: 'accepts a template whose only stylesheet fails to parse',
    ...fixtureCase('invalid-scss', 'broken.component.html')
  },
  {
    name: 'accepts classes matched by the configured ignore patterns',
    ...fixtureCase('ignored', 'hooks.component.html'),
    options: widenedPatterns
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a static token and a class binding the stylesheet misses',
    ...fixtureCase('flat', 'card.component.html'),
    errors: flatErrors
  },
  {
    name: 'reports a class the stylesheet linked from the template misses',
    ...fixtureCase('linked', 'page.html'),
    errors: missingClassErrors
  },
  {
    name: 'resolves nested, media, and multi-parent selectors',
    ...fixtureCase('nested', 'panel.component.html'),
    errors: missingClassErrors
  },
  {
    name: 'follows use and import partials of the component stylesheet',
    ...fixtureCase('partials', 'list.component.html'),
    errors: partialsErrors
  },
  {
    name: 'treats an interpolated selector as a pattern, not a bare prefix',
    ...fixtureCase('interpolation', 'badge.component.html'),
    errors: interpolationErrors
  },
  {
    name: 'reads styleUrls and inline styles from component metadata',
    ...fixtureCase('metadata', 'hero.component.html'),
    errors: missingClassErrors
  },
  {
    name: 'reads a component that declares inline styles and no stylesheet',
    ...fixtureCase('inline-styles-only', 'banner.component.html'),
    errors: missingClassErrors
  },
  {
    name: 'reports a global class when no global stylesheet is configured',
    ...fixtureCase('global', 'app.component.html'),
    errors: globalErrors
  },
  {
    name: 'accepts a global class once the global stylesheet is configured',
    ...fixtureCase('global', 'app.component.html'),
    options: globalOptions,
    errors: missingClassErrors
  },
  {
    name: 'reads literal class names out of class binding expressions',
    ...fixtureCase('expressions', 'widget.component.html'),
    errors: expressionErrors
  },
  {
    name: 'ignores framework prefixes by default',
    ...fixtureCase('ignored', 'hooks.component.html'),
    errors: missingClassErrors
  },
  {
    name: 'replaces the default ignore patterns with the configured ones',
    ...fixtureCase('ignored', 'hooks.component.html'),
    options: replacedPatterns,
    errors: prefixedErrors
  },
  {
    name: 'skips custom elements and containers whose classes are unknowable',
    ...fixtureCase('custom-element', 'page.component.html'),
    errors: missingClassErrors
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
