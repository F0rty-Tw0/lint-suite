// Scenario: ngOnChanges only exempts inputs; unread outputs of the same class are still reported.
// expect unusedField: changed
// expect unusedField: legacyChanged
import {
  Component,
  EventEmitter,
  Input,
  Output,
  input,
  output
} from '@angular/core';
import type { OnChanges, SimpleChanges } from '@angular/core';

@Component({ selector: 'app-changes-outputs', template: '' })
export class ChangesOutputsComponent implements OnChanges {
  readonly name = input('');
  @Input() legacyName = '';
  readonly changed = output<string>();
  @Output() legacyChanged = new EventEmitter<string>();

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }
}
