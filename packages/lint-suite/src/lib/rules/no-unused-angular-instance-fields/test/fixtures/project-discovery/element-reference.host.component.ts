import { Component } from '@angular/core';

import { ElementReferenceComponent } from './element-reference.component';

@Component({
  selector: 'app-element-reference-host',
  imports: [ElementReferenceComponent],
  template:
    '<app-element-reference #ref></app-element-reference>{{ ref.label }}'
})
export class ElementReferenceHostComponent {}
