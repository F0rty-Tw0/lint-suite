import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { angular } from '../../angular.js';

type IncrementalProject = {
  readonly projectDirectory: string;
  readonly linter: Linter;
  readonly file: (name: string) => string;
  readonly lint: (name: string, code: string) => string[];
  readonly touch: (name: string, content: string) => void;
  readonly dispose: () => void;
};

const rule = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean)?.rules?.['no-unused-instance-fields'];

assert.ok(rule, 'angular preset must register no-unused-instance-fields');

const ruleId = 'lint-suite-angular/no-unused-instance-fields';
const config = (projectDirectory: string): Linter.Config => ({
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    parserOptions: { projectService: true, tsconfigRootDir: projectDirectory },
    sourceType: 'module'
  },
  plugins: {
    'lint-suite-angular': { rules: { 'no-unused-instance-fields': rule } }
  },
  rules: { [ruleId]: ['error', { analysis: 'project' }] }
});

const tsconfig = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    experimentalDecorators: false,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    lib: ['ES2022', 'DOM']
  },
  include: ['**/*.ts']
});

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
  '../../../../../../node_modules/@angular/core'
);

export const templateSettled = async (): Promise<void> => sleep(300);

export const createIncrementalProject = (): IncrementalProject => {
  const projectDirectory = mkdtempSync(
    join(tmpdir(), 'lint-suite-incremental-')
  );

  writeFileSync(join(projectDirectory, 'tsconfig.json'), tsconfig);
  writeFileSync(
    join(projectDirectory, 'package.json'),
    JSON.stringify({ name: 'incremental-fixture', private: true })
  );
  mkdirSync(join(projectDirectory, 'node_modules', '@angular'), {
    recursive: true
  });
  symlinkSync(
    angularCore,
    join(projectDirectory, 'node_modules', '@angular', 'core'),
    'dir'
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

  const linter = new Linter({ cwd: projectDirectory });

  return {
    projectDirectory,
    linter,
    file,
    lint: (name: string, code: string): string[] =>
      linter
        .verify(code, config(projectDirectory), { filename: file(name) })
        .map((message) => {
          assert.ok(
            message.messageId,
            `unexpected message: ${message.message}`
          );

          return `${message.messageId}:${/'([^']+)'/u.exec(message.message)?.[1]}`;
        })
        .sort(),
    touch: (name: string, content: string): void => {
      writeFileSync(file(name), content);
      // Bump mtime by a full second so the change is visible on coarse
      // filesystems even when the file is rewritten immediately.
      utimesSync(file(name), new Date(), new Date(Date.now() + 1000));
    },
    dispose: (): void => {
      rmSync(projectDirectory, { force: true, recursive: true });
    }
  };
};
