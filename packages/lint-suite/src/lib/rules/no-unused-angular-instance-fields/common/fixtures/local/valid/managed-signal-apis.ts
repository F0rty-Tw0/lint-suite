// Scenario: Angular-managed signal fields (inputs, model, output, queries) are never reported even when unread.
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

@Component({ selector: 'app-managed', template: '' })
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
}
