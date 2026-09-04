import { mkdirSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { Linter } from 'eslint';

import { copyFixtureProject } from './fixture-project.spec.util.js';
import { reportedMembers } from './lint-messages.spec.util.js';
import { lintConfig } from './rule-under-test.spec.util.js';

type IncrementalProject = {
  readonly projectDirectory: string;
  readonly linter: Linter;
  readonly file: (name: string) => string;
  readonly lint: (name: string, code: string) => string[];
  readonly touch: (name: string, content: string) => void;
  readonly dispose: () => void;
};

export const widget = (
  members: string
): string => `import { Component } from '@angular/core';

@Component({ selector: 'app-widget', templateUrl: './widget.component.html' })
export class WidgetComponent {
${members}
}
`;

export const widgetMembers = `  readonly title = 'title';
  readonly exposed = 'exposed';
  readonly hidden = 'hidden';`;

export const consumer = (
  body: string
): string => `import { Component, viewChild } from '@angular/core';

import { WidgetComponent } from './widget.component';

@Component({ selector: 'app-consumer', template: '<app-widget />' })
export class ConsumerComponent {
  readonly widget = viewChild.required(WidgetComponent);

  read(): string {
${body}
  }
}
`;

export const consumerBody = `    return this.widget().exposed;`;

export const panel = (
  exportAs: string
): string => `import { Directive } from '@angular/core';

@Directive({ selector: '[appPanel]'${exportAs} })
export class PanelDirective {
  readonly state = 'open';
}
`;

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

export const panelHostImporting = (
  directive: string
): string => `import { Component } from '@angular/core';

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

export const paths = (template: string): string =>
  `export const GALLERY_TEMPLATE_URL = './${template}';\n`;

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

export const broken = (
  template: string
): string => `import { Component } from '@angular/core';

@Component({ selector: 'app-broken', template: '${template}' })
export class BrokenComponent {}
`;

const angularCore = join(
  import.meta.dirname,
  '../../../../../../../node_modules/@angular/core'
);

export const templateSettled = async (): Promise<void> => sleep(300);

export const createIncrementalProject = (): IncrementalProject => {
  const project = copyFixtureProject('incremental', 'lint-suite-incremental-');
  const projectDirectory = project.directory;

  mkdirSync(join(projectDirectory, 'node_modules', '@angular'), {
    recursive: true
  });
  symlinkSync(
    angularCore,
    join(projectDirectory, 'node_modules', '@angular', 'core'),
    'junction'
  );
  mkdirSync(join(projectDirectory, 'src'));

  const file = (name: string): string => join(projectDirectory, 'src', name);

  writeFileSync(file('widget.component.ts'), widget(widgetMembers));
  writeFileSync(file('widget.component.html'), '<h1>{{ title }}</h1>');
  writeFileSync(file('consumer.component.ts'), consumer(consumerBody));
  writeFileSync(file('panel.directive.ts'), panel(''));
  writeFileSync(file('panel-host.component.ts'), panelHost);
  writeFileSync(file('other-panel.directive.ts'), otherPanel);
  writeFileSync(file('broken.component.ts'), broken('<p>ok</p>'));
  writeFileSync(file('paths.ts'), paths('gallery.component.html'));
  writeFileSync(file('gallery.component.ts'), gallery);
  writeFileSync(file('gallery.component.html'), '<h1>{{ shown }}</h1>');
  writeFileSync(
    file('gallery-alt.component.html'),
    '<h1>{{ shown }} {{ hidden }}</h1>'
  );

  const config = lintConfig({
    analysis: 'project',
    directory: projectDirectory
  });
  const linter = new Linter({ cwd: projectDirectory });

  const incrementalProject: IncrementalProject = {
    projectDirectory,
    linter,
    file,
    lint: (name: string, code: string): string[] =>
      reportedMembers(linter.verify(code, config, { filename: file(name) })),
    touch: (name: string, content: string): void => {
      writeFileSync(file(name), content);
      // Bump mtime by a full second so the change is visible on coarse
      // filesystems even when the file is rewritten immediately.
      utimesSync(file(name), new Date(), new Date(Date.now() + 1000));
    },
    dispose: project.dispose
  };

  return incrementalProject;
};
