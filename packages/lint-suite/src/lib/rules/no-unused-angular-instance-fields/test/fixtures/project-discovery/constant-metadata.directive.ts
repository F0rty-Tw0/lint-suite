// Scenario: exportAs given as an imported constant still registers the
// directive under that reference name.
import { Directive } from '@angular/core';

import { PANEL_EXPORT_AS } from './constant-metadata.const';

@Directive({ selector: '[appConstPanel]', exportAs: PANEL_EXPORT_AS })
export class ConstantMetadataDirective {
  readonly viaConstantExportAs = 'used';
  readonly unreadConstant = 'unused';
}
