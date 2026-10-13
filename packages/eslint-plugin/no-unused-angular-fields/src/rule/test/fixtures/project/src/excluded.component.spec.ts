// Scenario: spec files are skipped entirely, so this unread field is not reported.
import { Component } from '@angular/core';

@Component({ selector: 'app-excluded-spec', template: '' })
export class ExcludedSpecComponent {
  private readonly unreadInSpec = 'unused';
}
