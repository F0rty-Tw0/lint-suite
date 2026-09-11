// Scenario: templateUrl given as an imported constant is resolved, so the
// template is read instead of the metadata failing closed.
import { Component } from '@angular/core';

import { PANEL_TEMPLATE_URL } from './constant-metadata.const';
import { ConstantMetadataDirective } from './constant-metadata.directive';

@Component({
  selector: 'app-constant-metadata-host',
  imports: [ConstantMetadataDirective],
  templateUrl: PANEL_TEMPLATE_URL
})
export class ConstantMetadataHostComponent {
  readonly shownInTemplate = 'used';
  readonly missingFromTemplate = 'unused';
}
