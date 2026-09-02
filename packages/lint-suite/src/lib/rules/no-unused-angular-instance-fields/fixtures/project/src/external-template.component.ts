// Scenario: a component's own external template reads its fields and a nested chain in project mode.
import { Component } from '@angular/core';

@Component({
  selector: 'app-external-template',
  templateUrl: './external-template.component.html'
})
export class ExternalTemplateComponent {
  protected readonly title = 'Title';
  protected readonly user = { profile: { name: 'Name' } };

  protected save(): void {}
}
