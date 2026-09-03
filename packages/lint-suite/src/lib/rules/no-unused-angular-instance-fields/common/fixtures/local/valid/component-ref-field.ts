// Scenario: a field typed as Angular ComponentRef is a handle managed by Angular and is exempt.
import { Component, ComponentRef } from '@angular/core';

@Component({ selector: 'app-component-ref', template: '' })
export class ComponentRefComponent {
  private ref?: ComponentRef<unknown>;
}
