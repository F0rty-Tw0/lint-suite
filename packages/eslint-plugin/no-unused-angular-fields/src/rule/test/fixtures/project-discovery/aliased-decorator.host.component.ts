// Scenario: the host component uses a namespace-imported Angular decorator.
import * as ng from '@angular/core';

import { AliasedDecoratorDirective } from './aliased-decorator.directive';

@ng.Component({
  selector: 'app-aliased-host',
  imports: [AliasedDecoratorDirective],
  template: '<p appAliased #ref="appAliased">{{ ref.viaAlias }}</p>'
})
export class AliasedDecoratorHostComponent {}
