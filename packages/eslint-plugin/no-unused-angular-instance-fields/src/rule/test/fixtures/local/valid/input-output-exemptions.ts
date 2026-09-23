// Scenario: unread inputs of classes with ngOnChanges, observable-backed outputs and inputs combined with other decorators are not reported.
import {
  Component,
  HostBinding,
  Input,
  Output,
  input,
  model,
  signal
} from '@angular/core';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import type { OnChanges, SimpleChanges } from '@angular/core';

@Component({ selector: 'app-changes-inputs', template: '' })
export class ChangesInputsComponent implements OnChanges {
  readonly name = input('');
  readonly id = input.required<string>();
  readonly checked = model(false);
  @Input() legacyName = '';

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes['name']);
  }
}

@Component({ selector: 'app-observable-outputs', template: '' })
export class ObservableOutputsComponent {
  private readonly count = signal(0);
  @Output() readonly streamed = toObservable(this.count);
  readonly interop = outputFromObservable(toObservable(this.count));
}

@Component({ selector: 'app-mixed-decorators', template: '' })
export class MixedDecoratorsComponent {
  @HostBinding('class.active') @Input() active = false;
}
