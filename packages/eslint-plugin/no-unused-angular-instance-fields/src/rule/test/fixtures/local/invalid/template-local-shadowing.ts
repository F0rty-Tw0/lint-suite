// Scenario: a template loop variable shadows a same-named field; only the iterated field is read.
// expect unusedField: item
import { Component } from '@angular/core';

@Component({
  selector: 'app-template-shadow',
  template: '@for (item of items; track item) { {{ item }} }'
})
export class TemplateShadowComponent {
  protected readonly item = 'field';
  protected readonly items = ['a'];
}
