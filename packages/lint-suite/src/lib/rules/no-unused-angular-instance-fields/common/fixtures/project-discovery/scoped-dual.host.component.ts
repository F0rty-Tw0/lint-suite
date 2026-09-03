import { Component } from '@angular/core';

import { ScopedDualInScopeDirective } from './scoped-dual.in-scope.directive';

@Component({
  selector: 'app-scoped-dual-host',
  imports: [ScopedDualInScopeDirective],
  template: '<p appDualInScope #ref="appDual">{{ ref.value }}</p>'
})
export class ScopedDualHostComponent {}
