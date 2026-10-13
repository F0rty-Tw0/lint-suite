// Scenario: signal inputs, models, outputs and queries read by the class or template are not reported.
import {
  Component,
  contentChild,
  contentChildren,
  input,
  model,
  output,
  viewChild,
  viewChildren
} from '@angular/core';
import type { ElementRef } from '@angular/core';

@Component({
  selector: 'app-managed',
  template:
    '<button #box (click)="toggle()">{{ name() }} {{ id() }} {{ slot() }}</button>'
})
export class ManagedComponent {
  readonly name = input<string>('');
  readonly id = input.required<string>();
  readonly checked = model(false);
  readonly changed = output<string>();
  readonly box = viewChild<ElementRef>('box');
  readonly requiredBox = viewChild.required<ElementRef>('box');
  readonly boxes = viewChildren<ElementRef>('box');
  readonly slot = contentChild<ElementRef>('slot');
  readonly slots = contentChildren<ElementRef>('slot');

  protected toggle(): void {
    this.checked.set(true);
    this.changed.emit('toggled');
    console.log(this.box(), this.requiredBox(), this.boxes(), this.slots());
  }
}
