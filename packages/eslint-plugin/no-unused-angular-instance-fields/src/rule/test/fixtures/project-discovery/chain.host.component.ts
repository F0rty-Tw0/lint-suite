import { Component } from '@angular/core';

import { ChainDirective } from './chain.directive';

@Component({
  selector: 'app-chain-host',
  imports: [ChainDirective],
  template:
    '<p appChain #ref="appChain">{{ ref.describe() }} {{ ref.state?.label }}</p>'
})
export class ChainHostComponent {}
