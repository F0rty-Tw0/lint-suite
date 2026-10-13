// Scenario: this directive is in the host component's standalone imports, so
// the #ref="appDual" reference resolves to it.
import { Directive } from '@angular/core';

@Directive({ selector: '[appDualInScope]', exportAs: 'appDual' })
export class ScopedDualInScopeDirective {
  readonly value = 'used';
  readonly unreadInScope = 'unused';
}
