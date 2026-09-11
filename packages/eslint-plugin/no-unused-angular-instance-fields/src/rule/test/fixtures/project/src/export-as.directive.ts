// Scenario: directive members read from another component's template through an exportAs reference.
import { Directive } from '@angular/core';

@Directive({ selector: '[appExportAs]', exportAs: 'appExportAs' })
export class ExportAsDirective {
  readonly exported = 'exported';
  readonly config = { label: 'label' };

  describe(): string {
    return 'described';
  }
}
