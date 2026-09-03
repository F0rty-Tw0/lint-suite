/*
 * Editor-style sessions: one Linter with a live project service lints files
 * whose contents change between calls. Every edit hands the rule a new
 * Program, so these tests pin down that the project index is updated
 * incrementally and stays exact across edits to the linted file, to files
 * that read it, to external templates, and to directive metadata.
 */
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import {
  broken,
  consumer,
  consumerBody,
  createIncrementalProject,
  gallery,
  otherPanel,
  panel,
  panelHost,
  panelHostImporting,
  paths,
  templateSettled,
  widget,
  widgetMembers
} from './no-unused-angular-instance-fields.incremental.spec-support.js';

let project: ReturnType<typeof createIncrementalProject>;

const lint = (name: string, code: string): string[] => project.lint(name, code);
const touch = (name: string, content: string): void =>
  project.touch(name, content);

before(() => {
  project = createIncrementalProject();
});

after(() => {
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
