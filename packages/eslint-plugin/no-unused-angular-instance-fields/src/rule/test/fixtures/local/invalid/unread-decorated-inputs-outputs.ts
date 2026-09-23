// Scenario: @Input() fields and EventEmitter-backed @Output() fields that neither the class nor its template read are reported.
// expect unusedField: name
// expect unusedField: id
// expect unusedField: changed
// expect unusedField: aliased
import {
  Component,
  EventEmitter,
  Input,
  Input as BindingInput,
  Output
} from '@angular/core';

@Component({ selector: 'app-unread-decorated-bindings', template: '' })
export class UnreadDecoratedBindingsComponent {
  @Input() name = '';
  @Input({ required: true }) id!: string;
  @Output() changed = new EventEmitter<string>();
  @BindingInput() aliased = 0;
}
