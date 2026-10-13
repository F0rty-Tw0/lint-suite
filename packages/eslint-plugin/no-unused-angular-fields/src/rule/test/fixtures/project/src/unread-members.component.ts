// Scenario: an unread public field and method are reported after a successful project analysis.
// expect unusedField: leftover
// expect unusedMethod: helper
import { Component } from '@angular/core';

@Component({ selector: 'app-unread-members', template: '' })
export class UnreadMembersComponent {
  readonly leftover = 'unused';

  helper(): void {}
}
