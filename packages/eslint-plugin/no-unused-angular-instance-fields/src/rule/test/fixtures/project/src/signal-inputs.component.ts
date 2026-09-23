// Scenario: a signal input read only by the component's external template is not reported, an unread one is reported in project mode.
// expect unusedField: hidden
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-signal-inputs',
  templateUrl: './signal-inputs.component.html'
})
export class SignalInputsComponent {
  readonly label = input('');
  readonly hidden = input('');
}
