export const widget = (members: string): string => {
  return `import { Component } from '@angular/core';

@Component({ selector: 'app-widget', templateUrl: './widget.component.html' })
export class WidgetComponent {
${members}
}
`;
};

export const widgetMembers = `  readonly title = 'title';
  readonly exposed = 'exposed';
  readonly hidden = 'hidden';`;

export const consumer = (body: string): string => {
  return `import { Component, viewChild } from '@angular/core';

import { WidgetComponent } from './widget.component';

@Component({ selector: 'app-consumer', template: '<app-widget />' })
export class ConsumerComponent {
  readonly widget = viewChild.required(WidgetComponent);

  read(): string {
${body}
  }
}
`;
};

export const consumerBody = `    return this.widget().exposed;`;

export const panel = (exportAs: string): string => {
  return `import { Directive } from '@angular/core';

@Directive({ selector: '[appPanel]'${exportAs} })
export class PanelDirective {
  readonly state = 'open';
}
`;
};

export const panelHost = `import { Component } from '@angular/core';

import { PanelDirective } from './panel.directive';

@Component({
  selector: 'app-panel-host',
  imports: [PanelDirective],
  template: '<div appPanel #panel="appPanel">{{ panel.state }}</div>'
})
export class PanelHostComponent {}
`;

export const otherPanel = `import { Directive } from '@angular/core';

@Directive({ selector: '[appOtherPanel]', exportAs: 'appPanel' })
export class OtherPanelDirective {
  readonly state = 'other';
}
`;

export const panelHostImporting = (directive: string): string => {
  return `import { Component } from '@angular/core';

import { OtherPanelDirective } from './other-panel.directive';
import { PanelDirective } from './panel.directive';

@Component({
  selector: 'app-panel-host',
  imports: [${directive}],
  template: '<div appPanel appOtherPanel #panel="appPanel">{{ panel.state }}</div>'
})
export class PanelHostComponent {
  protected readonly imported = [OtherPanelDirective, PanelDirective];
}
`;
};

export const paths = (template: string): string => {
  return `export const GALLERY_TEMPLATE_URL = './${template}';\n`;
};

export const gallery = `import { Component } from '@angular/core';

import { GALLERY_TEMPLATE_URL } from './paths';

const CAPTION_TEMPLATE = '<p>{{ caption }}</p>';

@Component({ selector: 'app-gallery', templateUrl: GALLERY_TEMPLATE_URL })
export class GalleryComponent {
  readonly shown = 'shown';
  readonly hidden = 'hidden';
}

@Component({ selector: 'app-caption', template: CAPTION_TEMPLATE })
export class CaptionComponent {
  readonly caption = 'caption';
  readonly unused = 'unused';
}
`;

export const broken = (template: string): string => {
  return `import { Component } from '@angular/core';

@Component({ selector: 'app-broken', template: '${template}' })
export class BrokenComponent {}
`;
};
