// Scenario: decorated and signal inputs and outputs read by the class, its template or its host metadata are not reported.
import {
  Component,
  EventEmitter,
  Input,
  Output,
  input,
  model,
  output
} from '@angular/core';

@Component({
  selector: 'app-read-bindings',
  template: '{{ title }} {{ label() }}',
  host: { '[attr.aria-label]': 'hostLabel', '(click)': 'select()' }
})
export class ReadBindingsComponent {
  @Input() title = '';
  @Input() hostLabel = '';
  @Input() count = 0;
  @Output() selected = new EventEmitter<number>();
  readonly label = input('');
  readonly value = model(0);
  readonly picked = output<number>();

  protected select(): void {
    this.selected.emit(this.count);
    this.value.update((current) => current + 1);
    this.picked.emit(this.value());
  }
}
