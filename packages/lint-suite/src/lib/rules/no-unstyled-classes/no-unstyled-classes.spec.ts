import type { RuleTester } from 'eslint';

import {
  fixtureCase,
  fixtureFile
} from './test/utils/fixture-template.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester,
  unstyledClassError
} from './test/utils/rule-under-test.spec.util.ts';

const globalStyles = [fixtureFile('global', 'styles.scss')];
const globalOptions = [{ globalStyles }];
const replacedPatterns = [{ ignoreClassPatterns: ['^nope$'] }];
const widenedPatterns = [
  { ignoreClassPatterns: ['^(js|qa|mat|cdk|mdc)-', '^nope$'] }
];

const unstyledOneError = unstyledClassError('unstyled-one');
const staticTokenError: RuleTester.TestCaseError = {
  ...unstyledOneError,
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

const noStylesheetCase = fixtureCase('no-stylesheet', 'plain.component.html');
const invalidScssCase = fixtureCase('invalid-scss', 'broken.component.html');
const ignoredHooksCase = fixtureCase('ignored', 'hooks.component.html');
const flatCardCase = fixtureCase('flat', 'card.component.html');
const linkedPageCase = fixtureCase('linked', 'page.html');
const nestedPanelCase = fixtureCase('nested', 'panel.component.html');
const partialsListCase = fixtureCase('partials', 'list.component.html');
const interpolationBadgeCase = fixtureCase(
  'interpolation',
  'badge.component.html'
);
const metadataHeroCase = fixtureCase('metadata', 'hero.component.html');
const inlineStylesOnlyBannerCase = fixtureCase(
  'inline-styles-only',
  'banner.component.html'
);
const globalAppCase = fixtureCase('global', 'app.component.html');
const expressionsWidgetCase = fixtureCase(
  'expressions',
  'widget.component.html'
);
const customElementPageCase = fixtureCase(
  'custom-element',
  'page.component.html'
);

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a template whose component declares no stylesheet',
    ...noStylesheetCase
  },
  {
    name: 'accepts a template whose only stylesheet fails to parse',
    ...invalidScssCase
  },
  {
    name: 'accepts classes matched by the configured ignore patterns',
    ...ignoredHooksCase,
    options: widenedPatterns
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a static token and a class binding the stylesheet misses',
    ...flatCardCase,
    errors: flatErrors
  },
  {
    name: 'reports a class the stylesheet linked from the template misses',
    ...linkedPageCase,
    errors: missingClassErrors
  },
  {
    name: 'resolves nested, media, and multi-parent selectors',
    ...nestedPanelCase,
    errors: missingClassErrors
  },
  {
    name: 'follows use and import partials of the component stylesheet',
    ...partialsListCase,
    errors: partialsErrors
  },
  {
    name: 'treats an interpolated selector as a pattern, not a bare prefix',
    ...interpolationBadgeCase,
    errors: interpolationErrors
  },
  {
    name: 'reads styleUrls and inline styles from component metadata',
    ...metadataHeroCase,
    errors: missingClassErrors
  },
  {
    name: 'reads a component that declares inline styles and no stylesheet',
    ...inlineStylesOnlyBannerCase,
    errors: missingClassErrors
  },
  {
    name: 'reports a global class when no global stylesheet is configured',
    ...globalAppCase,
    errors: globalErrors
  },
  {
    name: 'accepts a global class once the global stylesheet is configured',
    ...globalAppCase,
    options: globalOptions,
    errors: missingClassErrors
  },
  {
    name: 'reads literal class names out of class binding expressions',
    ...expressionsWidgetCase,
    errors: expressionErrors
  },
  {
    name: 'ignores framework prefixes by default',
    ...ignoredHooksCase,
    errors: missingClassErrors
  },
  {
    name: 'replaces the default ignore patterns with the configured ones',
    ...ignoredHooksCase,
    options: replacedPatterns,
    errors: prefixedErrors
  },
  {
    name: 'skips custom elements and containers whose classes are unknowable',
    ...customElementPageCase,
    errors: missingClassErrors
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
