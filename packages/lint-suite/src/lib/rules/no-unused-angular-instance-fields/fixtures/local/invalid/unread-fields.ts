// Scenario: unread public, protected and private component fields are all reported.
// expect unusedField: exposed
// expect unusedField: inherited
// expect unusedField: hidden
import { Component } from '@angular/core';

@Component({ selector: 'app-unread-fields', template: '' })
export class UnreadFieldsComponent {
  exposed = 1;
  protected inherited = 2;
  private hidden = 3;
}
