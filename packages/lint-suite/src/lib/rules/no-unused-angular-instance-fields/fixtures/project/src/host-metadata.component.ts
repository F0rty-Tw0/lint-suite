// Scenario: host bindings and listeners read members in project mode too.
import { Component } from '@angular/core';

@Component({
  selector: 'app-host-metadata',
  template: '',
  host: { '[class.active]': 'active', '(click)': 'toggle()' }
})
export class HostMetadataComponent {
  private active = false;

  private toggle(): void {
    this.active = !this.active;
  }
}
