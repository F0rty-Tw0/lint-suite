// Scenario: a host listener that only assigns a field does not read it.
// expect unusedField: value
import { Component } from '@angular/core';

@Component({
  selector: 'app-host-write',
  template: '',
  host: { '(click)': 'value = 1' }
})
export class HostWriteComponent {
  protected value = 0;
}
