// Scenario: a template event handler that only assigns a field does not read it.
// expect unusedField: value
import { Component } from '@angular/core';

@Component({
  selector: 'app-template-write',
  template: '<button (click)="value = 1">Set</button>'
})
export class TemplateWriteComponent {
  protected value = 0;
}
