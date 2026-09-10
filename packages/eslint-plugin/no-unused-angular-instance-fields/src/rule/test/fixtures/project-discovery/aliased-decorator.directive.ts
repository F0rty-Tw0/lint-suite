// Scenario: a directive declared with an aliased Angular decorator import is
// still discovered, so the member read from another template counts and the
// member nothing reads is still reported.
import { Directive as NgDirective } from '@angular/core';

@NgDirective({ selector: '[appAliased]', exportAs: 'appAliased' })
export class AliasedDecoratorDirective {
  readonly viaAlias = 'used';
  readonly unreadAlias = 'unused';
}
