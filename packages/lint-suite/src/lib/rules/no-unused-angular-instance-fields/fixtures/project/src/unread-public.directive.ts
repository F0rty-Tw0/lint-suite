// Scenario: project mode can see every consumer, so an unread public directive field is reported.
// expect unusedField: exposed
import { Directive } from '@angular/core';

@Directive({ selector: '[appUnreadPublic]' })
export class UnreadPublicDirective {
  readonly exposed = 'unused';
}
