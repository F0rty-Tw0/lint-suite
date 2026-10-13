import { Component, Directive } from '@angular/core';

@Directive({ selector: '[projectUsage]', exportAs: 'projectUsage' })
export class ProjectTemplateDirective {
  readonly readFromTemplate = 'used';
}

@Component({
  imports: [ProjectTemplateDirective],
  template:
    '<div projectUsage #usage="projectUsage">{{ usage.readFromTemplate }}</div>'
})
export class ProjectTemplateConsumerComponent {}
