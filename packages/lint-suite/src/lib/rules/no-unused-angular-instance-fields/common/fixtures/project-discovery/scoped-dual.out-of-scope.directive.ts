// Scenario: same exportAs, but never imported by the host component, so the
// reference must not resolve to it.
import { Directive } from '@angular/core';

@Directive({ selector: '[appDualOutOfScope]', exportAs: 'appDual' })
export class ScopedDualOutOfScopeDirective {
  readonly value = 'unused';
}
