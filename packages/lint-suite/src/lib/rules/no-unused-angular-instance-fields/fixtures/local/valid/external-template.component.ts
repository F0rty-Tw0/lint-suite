// Scenario: an external templateUrl template reads fields and calls methods.
import { Component } from '@angular/core';

@Component({
  selector: 'app-external-template',
  templateUrl: './external-template.component.html'
})
export class ExternalTemplateComponent {
  protected readonly title = 'Title';
  protected readonly disabled = false;

  protected submit(): void {}
}
