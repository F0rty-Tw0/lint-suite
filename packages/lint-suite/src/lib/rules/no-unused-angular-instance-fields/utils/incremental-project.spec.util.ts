import { mkdirSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { Linter } from 'eslint';

import { copyFixtureProject } from './fixture-project.spec.util.ts';
import {
  broken,
  consumer,
  consumerBody,
  gallery,
  otherPanel,
  panel,
  panelHost,
  paths,
  widget,
  widgetMembers
} from './incremental-source.spec.util.ts';
import { reportedMembers } from './lint-messages.spec.util.ts';
import { lintConfig } from './rule-under-test.spec.util.ts';

type IncrementalProject = {
  readonly projectDirectory: string;
  readonly linter: Linter;
  readonly file: (name: string) => string;
  readonly lint: (name: string, code: string) => string[];
  readonly touch: (name: string, content: string) => void;
  readonly dispose: () => void;
};

const angularCore = join(
  import.meta.dirname,
  '../../../../../../../node_modules/@angular/core'
);

export const templateSettled = async (): Promise<void> => sleep(300);

const seedProject = (file: (name: string) => string): void => {
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
};

const linkAngularCore = (projectDirectory: string): void => {
  mkdirSync(join(projectDirectory, 'node_modules', '@angular'), {
    recursive: true
  });
  symlinkSync(
    angularCore,
    join(projectDirectory, 'node_modules', '@angular', 'core'),
    'junction'
  );
};

export const createIncrementalProject = (): IncrementalProject => {
  const project = copyFixtureProject('incremental', 'lint-suite-incremental-');
  const projectDirectory = project.directory;

  linkAngularCore(projectDirectory);
  mkdirSync(join(projectDirectory, 'src'));

  const file = (name: string): string => join(projectDirectory, 'src', name);

  seedProject(file);

  const config = lintConfig({
    analysis: 'project',
    directory: projectDirectory
  });
  const linter = new Linter({ cwd: projectDirectory });

  const incrementalProject: IncrementalProject = {
    projectDirectory,
    linter,
    file,
    lint: (name: string, code: string): string[] => {
      const messages = linter.verify(code, config, { filename: file(name) });

      return reportedMembers(messages);
    },
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
