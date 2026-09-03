// Scenario: without allowEffectFields an unread effect() field is reported.
// expect unusedField: sync
import { Component, effect, signal } from '@angular/core';

@Component({ selector: 'app-effect-default', template: '' })
export class EffectDefaultComponent {
  private readonly value = signal(0);
  private readonly sync = effect(() => console.log(this.value()));
}
