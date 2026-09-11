// Scenario: host property bindings and listeners read fields and methods.
import { Component } from '@angular/core';

@Component({
  selector: 'app-host-metadata',
  template: '',
  host: {
    role: 'button',
    '[class.active]': 'active',
    '[attr.aria-label]': 'label',
    '[style.width.px]': 'width',
    '(click)': 'onClick($event)',
    '(window:resize)': 'onResize()'
  }
})
export class HostMetadataComponent {
  private readonly active = true;
  private readonly label = 'Label';
  private readonly width = 100;

  private onClick(event: Event): void {
    console.log(event);
  }

  private onResize(): void {}
}
