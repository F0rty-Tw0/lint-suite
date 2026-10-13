// Scenario: a field only assigned from another file is still unread.
// expect unusedField: assigned
import { Component } from '@angular/core';

@Component({ selector: 'app-written-elsewhere', template: '' })
export class WrittenElsewhereComponent {
  assigned = 0;
}
