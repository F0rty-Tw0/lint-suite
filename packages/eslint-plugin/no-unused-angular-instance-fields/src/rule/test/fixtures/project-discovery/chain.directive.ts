// Scenario: template read chains through a called segment and through safe
// navigation both resolve to directive members; a member outside the chains
// stays unread.
import { Directive } from '@angular/core';

@Directive({ selector: '[appChain]', exportAs: 'appChain' })
export class ChainDirective {
  readonly state: { label: string } | null = null;
  readonly unreadState = 'unused';

  describe(): string {
    return 'described';
  }
}
