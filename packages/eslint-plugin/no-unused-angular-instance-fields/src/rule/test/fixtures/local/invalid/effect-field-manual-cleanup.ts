// Scenario: with allowEffectFields, a manualCleanup effect must still be referenced to be destroyed.
// options: allowEffectFields
// expect unusedField: sync
import { Component, effect, signal } from '@angular/core';

@Component({ selector: 'app-effect-manual', template: '' })
export class EffectManualComponent {
  private readonly value = signal(0);
  private readonly sync = effect(() => console.log(this.value()), {
    manualCleanup: true
  });
}
