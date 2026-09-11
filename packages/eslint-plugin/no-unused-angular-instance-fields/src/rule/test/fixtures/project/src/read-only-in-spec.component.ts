// Scenario: a field read only from a spec file is still reported; spec reads do not count.
// expect unusedField: specOnly
import { Component } from '@angular/core';

@Component({ selector: 'app-read-only-in-spec', template: '' })
export class ReadOnlyInSpecComponent {
  readonly specOnly = 'unused';
}
