// Scenario: with allowEffectFields, an unread auto-cleaned effect() field is a managed field.
// options: allowEffectFields
import { Component, effect, signal } from '@angular/core';

@Component({ selector: 'app-effect', template: '' })
export class EffectComponent {
  private readonly value = signal(0);
  private readonly sync = effect(() => console.log(this.value()));
}
