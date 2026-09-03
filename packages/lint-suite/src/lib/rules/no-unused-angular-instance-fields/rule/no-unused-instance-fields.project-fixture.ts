import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RuleTester } from 'eslint';

import { parser } from './no-unused-instance-fields.spec-support.js';

type ProjectCase = {
  readonly code: string;
  readonly filename: string;
};

type ProjectFixture = {
  readonly directory: string;
  readonly tester: RuleTester;
  readonly property: ProjectCase;
  readonly element: ProjectCase;
  readonly destructuring: ProjectCase;
  readonly templateDirective: ProjectCase;
  readonly spec: ProjectCase;
  readonly unread: ProjectCase;
};

type FailingProjectFixture = {
  readonly directory: string;
  readonly tester: RuleTester;
  readonly component: ProjectCase;
};

const angularCoreDeclarations = `
  export declare function Component(metadata: Record<string, unknown>): ClassDecorator;
  export declare function Directive(metadata: Record<string, unknown>): ClassDecorator;
`;

const projectTsconfig = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    experimentalDecorators: true,
    noEmit: true,
    skipLibCheck: true
  },
  include: ['*.ts', '*.d.ts']
});

const writeAngularCoreFixture = (directory: string): void => {
  const angularCoreDirectory = join(
    directory,
    'node_modules',
    '@angular',
    'core'
  );

  mkdirSync(angularCoreDirectory, { recursive: true });
  writeFileSync(
    join(angularCoreDirectory, 'index.d.ts'),
    angularCoreDeclarations
  );
};

export const createProjectDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix));

  writeAngularCoreFixture(directory);
  writeFileSync(join(directory, 'tsconfig.json'), projectTsconfig);

  return directory;
};

const projectRuleTester = (directory: string): RuleTester =>
  new RuleTester({
    languageOptions: {
      ecmaVersion: 'latest',
      parser,
      parserOptions: { projectService: true, tsconfigRootDir: directory },
      sourceType: 'module'
    }
  });

const projectPropertyComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectPropertyComponent {
    readonly readFromProperty = 'used';
  }
`;
const projectElementComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectElementComponent {
    readonly readFromElement = 'used';
  }
`;
const projectDestructuringComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectDestructuringComponent {
    readonly readFromDestructuring = 'used';
  }
`;
const projectTemplateDirectiveCode = `
  import { Component, Directive } from '@angular/core';

  @Directive({ selector: '[projectUsage]', exportAs: 'projectUsage' })
  export class ProjectTemplateDirective {
    readonly readFromTemplate = 'used';
  }

  @Component({
    imports: [ProjectTemplateDirective],
    template: '<div projectUsage #usage="projectUsage">{{ usage.readFromTemplate }}</div>'
  })
  export class ProjectTemplateConsumerComponent {}
`;
const projectSpecCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectExcludedSpecComponent {
    private readonly unreadInSpec = 'unused';
  }
`;
const projectUnreadComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectUnreadComponent {
    readonly unreadInProject = 'unused';
  }
`;
const failingProjectComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '' })
  export class ProjectIndexFailureComponent {
    private readonly unreadAfterIndexFailure = 'unused';
  }
`;
const failingProjectBrokenComponentCode = `
  import { Component } from '@angular/core';

  @Component({ template: '<div' })
  export class ProjectIndexBrokenComponent {}
`;

export const projectFixture = (): ProjectFixture => {
  const directory = createProjectDirectory('unused-angular-fields-project-');
  const at = (name: string): string => join(directory, name);

  writeFileSync(
    at('project-property.component.ts'),
    projectPropertyComponentCode
  );
  writeFileSync(
    at('project-property.consumer.ts'),
    `
    import { ProjectPropertyComponent } from './project-property.component';

    declare const component: ProjectPropertyComponent;
    void component.readFromProperty;
  `
  );
  writeFileSync(
    at('project-element.component.ts'),
    projectElementComponentCode
  );
  writeFileSync(
    at('project-element.consumer.ts'),
    `
    import { ProjectElementComponent } from './project-element.component';

    declare const component: ProjectElementComponent;
    void component['readFromElement'];
  `
  );
  writeFileSync(
    at('project-destructuring.component.ts'),
    projectDestructuringComponentCode
  );
  writeFileSync(
    at('project-destructuring.consumer.ts'),
    `
    import { ProjectDestructuringComponent } from './project-destructuring.component';

    declare const component: ProjectDestructuringComponent;
    const { readFromDestructuring } = component;
    void readFromDestructuring;
  `
  );
  writeFileSync(
    at('project-template.directive.ts'),
    projectTemplateDirectiveCode
  );
  writeFileSync(at('project-unread.component.ts'), projectUnreadComponentCode);
  writeFileSync(at('project-excluded.spec.ts'), projectSpecCode);

  return {
    directory,
    tester: projectRuleTester(directory),
    property: {
      code: projectPropertyComponentCode,
      filename: at('project-property.component.ts')
    },
    element: {
      code: projectElementComponentCode,
      filename: at('project-element.component.ts')
    },
    destructuring: {
      code: projectDestructuringComponentCode,
      filename: at('project-destructuring.component.ts')
    },
    templateDirective: {
      code: projectTemplateDirectiveCode,
      filename: at('project-template.directive.ts')
    },
    spec: { code: projectSpecCode, filename: at('project-excluded.spec.ts') },
    unread: {
      code: projectUnreadComponentCode,
      filename: at('project-unread.component.ts')
    }
  };
};

export const failingProjectFixture = (): FailingProjectFixture => {
  const directory = createProjectDirectory(
    'unused-angular-fields-failing-project-'
  );
  const componentFilename = join(
    directory,
    'project-index-failure.component.ts'
  );

  writeFileSync(componentFilename, failingProjectComponentCode);
  writeFileSync(
    join(directory, 'project-index-broken.component.ts'),
    failingProjectBrokenComponentCode
  );

  return {
    directory,
    tester: projectRuleTester(directory),
    component: {
      code: failingProjectComponentCode,
      filename: componentFilename
    }
  };
};
