/*
 * Editor-style sessions: one Linter with a live project service lints files
 * whose contents change between calls. Every edit hands the rule a new
 * Program, so these tests pin down that the project index is updated
 * incrementally and stays exact across edits to the linted file, to files
 * that read it, to external templates, and to directive metadata.
 */
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
import { after, before, describe, test } from 'node:test';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { angular } from '../../angular.js';

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

const widget = (
  members: string
): string => `import { Component } from '@angular/core';

@Component({ selector: 'app-widget', templateUrl: './widget.component.html' })
export class WidgetComponent {
${members}
}
`;

const widgetMembers = `  readonly title = 'title';
  readonly exposed = 'exposed';
  readonly hidden = 'hidden';`;

const consumer = (
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

const consumerBody = `    return this.widget().exposed;`;

const panel = (
  exportAs: string
): string => `import { Directive } from '@angular/core';

@Directive({ selector: '[appPanel]'${exportAs} })
export class PanelDirective {
  readonly state = 'open';
}
`;

const panelHost = `import { Component } from '@angular/core';

import { PanelDirective } from './panel.directive';

@Component({
  selector: 'app-panel-host',
  imports: [PanelDirective],
  template: '<div appPanel #panel="appPanel">{{ panel.state }}</div>'
})
export class PanelHostComponent {}
`;

const otherPanel = `import { Directive } from '@angular/core';

@Directive({ selector: '[appOtherPanel]', exportAs: 'appPanel' })
export class OtherPanelDirective {
  readonly state = 'other';
}
`;

const panelHostImporting = (
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

const paths = (template: string): string =>
  `export const GALLERY_TEMPLATE_URL = './${template}';\n`;

const gallery = `import { Component } from '@angular/core';

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

const broken = (
  template: string
): string => `import { Component } from '@angular/core';

@Component({ selector: 'app-broken', template: '${template}' })
export class BrokenComponent {}
`;

const angularCore = join(
  import.meta.dirname,
  '../../../../../../node_modules/@angular/core'
);

let projectDirectory: string;
let linter: Linter;

const file = (name: string): string => join(projectDirectory, 'src', name);

const lint = (name: string, code: string): string[] =>
  linter
    .verify(code, config(projectDirectory), { filename: file(name) })
    .map((message) => {
      assert.ok(message.messageId, `unexpected message: ${message.message}`);

      return `${message.messageId}:${/'([^']+)'/u.exec(message.message)?.[1]}`;
    })
    .sort();

const touch = (name: string, content: string): void => {
  writeFileSync(file(name), content);
  // Bump mtime by a full second so the change is visible on coarse
  // filesystems even when the file is rewritten immediately.
  utimesSync(file(name), new Date(), new Date(Date.now() + 1000));
};

const templateSettled = async (): Promise<void> => sleep(300);

before(() => {
  projectDirectory = mkdtempSync(join(tmpdir(), 'lint-suite-incremental-'));
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

  linter = new Linter({ cwd: projectDirectory });
});

after(() => {
  rmSync(projectDirectory, { force: true, recursive: true });
});

describe('project analysis in an editor session', () => {
  test('initial state reports the member nobody reads', () => {
    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);
    assert.deepEqual(lint('consumer.component.ts', consumer(consumerBody)), [
      'unusedMethod:read'
    ]);
    assert.deepEqual(lint('panel.directive.ts', panel('')), [
      'unusedField:state'
    ]);
  });

  test('an edit to the linted file is reflected immediately', () => {
    const edited = `${widgetMembers}\n  readonly added = 'added';`;

    assert.deepEqual(lint('widget.component.ts', widget(edited)), [
      'unusedField:added',
      'unusedField:hidden'
    ]);
    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);
  });

  test('a consumer that stops reading a member invalidates the index', () => {
    lint('consumer.component.ts', consumer(`    return this.widget().title;`));

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:exposed',
      'unusedField:hidden'
    ]);

    lint('consumer.component.ts', consumer(consumerBody));

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);
  });

  test('a member added after its consumer was written counts as read', () => {
    lint(
      'consumer.component.ts',
      consumer(`    return this.widget().exposed + this.widget().pending;`)
    );

    const edited = `${widgetMembers}\n  readonly pending = 'pending';`;

    assert.deepEqual(lint('widget.component.ts', widget(edited)), [
      'unusedField:hidden'
    ]);

    lint('consumer.component.ts', consumer(consumerBody));
  });

  test('an edited external template is picked up', async () => {
    await templateSettled();
    touch('widget.component.html', '<h1>{{ title }} {{ hidden }}</h1>');

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), []);

    await templateSettled();
    touch('widget.component.html', '<h1>{{ title }}</h1>');

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);
  });

  test('a directive gaining exportAs makes its reference reads count', () => {
    assert.deepEqual(
      lint('panel.directive.ts', panel(", exportAs: 'appPanel'")),
      []
    );
    assert.deepEqual(lint('panel.directive.ts', panel('')), [
      'unusedField:state'
    ]);
  });
  test('metadata given as constants is resolved, not failed closed', () => {
    assert.deepEqual(lint('gallery.component.ts', gallery), [
      'unusedField:hidden',
      'unusedField:unused'
    ]);
  });

  test('a constant from another file re-discovers the component', () => {
    lint('paths.ts', paths('gallery-alt.component.html'));

    assert.deepEqual(lint('gallery.component.ts', gallery), [
      'unusedField:unused'
    ]);

    lint('paths.ts', paths('gallery.component.html'));

    assert.deepEqual(lint('gallery.component.ts', gallery), [
      'unusedField:hidden',
      'unusedField:unused'
    ]);
  });

  test('template references only resolve within standalone imports', () => {
    lint('panel.directive.ts', panel(", exportAs: 'appPanel'"));

    assert.deepEqual(lint('other-panel.directive.ts', otherPanel), [
      'unusedField:state'
    ]);

    lint('panel-host.component.ts', panelHostImporting('OtherPanelDirective'));

    assert.deepEqual(lint('other-panel.directive.ts', otherPanel), []);
    assert.deepEqual(
      lint('panel.directive.ts', panel(", exportAs: 'appPanel'")),
      ['unusedField:state']
    );

    lint('panel-host.component.ts', panelHost);
    lint('panel.directive.ts', panel(''));
  });

  test('a template that does not parse only rescues the names it mentions', () => {
    lint('consumer.component.ts', consumer(`    return this.widget().title;`));
    lint('broken.component.ts', broken('<div><span>{{ exposed }}</div>'));

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);

    lint('broken.component.ts', broken('<p>ok</p>'));

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:exposed',
      'unusedField:hidden'
    ]);

    lint('consumer.component.ts', consumer(consumerBody));
  });
});
