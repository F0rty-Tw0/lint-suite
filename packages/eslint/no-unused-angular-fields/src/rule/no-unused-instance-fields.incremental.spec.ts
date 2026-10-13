import assert from 'node:assert/strict';

import { afterAll, beforeAll, describe, test } from 'vitest';

import type { IncrementalProject } from './test/common/incremental-project.type.ts';
import {
  createIncrementalProject,
  templateSettled
} from './test/utils/incremental-project.spec.util.ts';
import {
  broken,
  consumer,
  consumerBody,
  consumerWithTemplateFile,
  emptyDirective,
  emptyHost,
  gallery,
  laterDirective,
  laterHost,
  orphan,
  otherPanel,
  panel,
  panelHost,
  panelHostImporting,
  paths,
  widget,
  widgetMembers
} from './test/utils/incremental-source.spec.util.ts';

let project: IncrementalProject;

const lint = (name: string, code: string): string[] => project.lint(name, code);
const touch = (name: string, content: string): void => {
  project.touch(name, content);
};

beforeAll(() => {
  project = createIncrementalProject();
});

afterAll(() => {
  project.dispose();
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

  test('an edited template of a neighbour is picked up without waiting', () => {
    touch('consumer.component.html', '<app-widget #w /> {{ w.hidden }}');
    lint('consumer.component.ts', consumerWithTemplateFile(consumerBody));

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), []);

    touch('consumer.component.html', '<app-widget #w />');

    assert.deepEqual(lint('widget.component.ts', widget(widgetMembers)), [
      'unusedField:hidden'
    ]);

    lint('consumer.component.ts', consumer(consumerBody));
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
  test('a directive read before its file exists counts once the file appears', async () => {
    const members = `  readonly laterCount = 1;\n  readonly laterHidden = 2;`;

    touch('later-host.component.ts', laterHost);
    await templateSettled();

    assert.deepEqual(lint('later-host.component.ts', laterHost), []);

    touch('later.directive.ts', laterDirective(members));
    await templateSettled();

    assert.deepEqual(lint('later.directive.ts', laterDirective(members)), [
      'unusedField:laterHidden'
    ]);
  });

  test('a directive imported while its file was empty is read once filled', async () => {
    const members = `  readonly emptyCount = 1;\n  readonly emptyHidden = 2;`;

    touch('empty.directive.ts', '');
    await templateSettled();

    assert.deepEqual(lint('empty.directive.ts', ''), []);

    touch('empty-host.component.ts', emptyHost);
    await templateSettled();

    assert.deepEqual(lint('empty-host.component.ts', emptyHost), []);

    touch('empty.directive.ts', emptyDirective(members));

    assert.deepEqual(lint('empty.directive.ts', emptyDirective(members)), [
      'unusedField:emptyHidden'
    ]);
  });

  test('a template file created after its component is read once it exists', async () => {
    touch('orphan.component.ts', orphan);
    await templateSettled();

    assert.deepEqual(lint('orphan.component.ts', orphan), []);

    touch('orphan.component.html', '<h1>{{ shown }}</h1>');

    assert.deepEqual(lint('orphan.component.ts', orphan), [
      'unusedField:hidden'
    ]);
  });
});
