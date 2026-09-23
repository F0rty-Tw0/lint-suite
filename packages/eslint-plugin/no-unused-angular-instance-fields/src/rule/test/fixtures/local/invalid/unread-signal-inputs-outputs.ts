// Scenario: signal inputs, required inputs, models and outputs that neither the class nor its template read are reported.
// expect unusedField: name
// expect unusedField: id
// expect unusedField: checked
// expect unusedField: changed
// expect unusedField: aliased
import {
  Component,
  input,
  input as signalInput,
  model,
  output
} from '@angular/core';

@Component({ selector: 'app-unread-signal-bindings', template: '' })
export class UnreadSignalBindingsComponent {
  readonly name = input<string>('');
  readonly id = input.required<string>();
  readonly checked = model(false);
  readonly changed = output<string>();
  readonly aliased = signalInput(0);
}
