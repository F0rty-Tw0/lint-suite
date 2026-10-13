// Scenario: an unread public component method is reported.
// expect unusedMethod: helper
import { Component } from '@angular/core';

@Component({ selector: 'app-unread-method', template: '' })
export class UnreadMethodComponent {
  helper(): void {}
}
