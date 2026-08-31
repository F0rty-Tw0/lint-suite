import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, describe, test } from 'node:test';

import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { angular } from '../../angular.js';

const angularPlugin = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean);

function requireAngularPlugin(
  plugin: typeof angularPlugin
): NonNullable<typeof angularPlugin> {
  assert.ok(
    plugin,
    'angular preset must register lint-suite-angular/no-unused-instance-fields'
  );
  return plugin;
}

const configuredAngularPlugin = requireAngularPlugin(angularPlugin);
assert.ok(
  configuredAngularPlugin.rules?.['no-unused-instance-fields'],
  'angular plugin must expose no-unused-instance-fields'
);

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../..'
);
const projectDirectory = mkdtempSync(
  join(repositoryRoot, '.no-unused-instance-fields-project-')
);

after(() => rmSync(projectDirectory, { force: true, recursive: true }));

function writeProjectFile(relativeFilename: string, contents: string): void {
  const filename = join(projectDirectory, relativeFilename);
  mkdirSync(dirname(filename), { recursive: true });
  writeFileSync(filename, contents);
}

writeProjectFile(
  'tsconfig.json',
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        useDefineForClassFields: false,
        lib: ['ES2022', 'DOM']
      },
      exclude: [
        'src/analysis-failure/**/*.ts',
        'src/angular-options-failure/**/*.ts'
      ],
      include: ['src/**/*.ts']
    },
    null,
    2
  )}\n`
);

const fixtureFiles: Record<string, string> = {
  'src/analysis-failure/tsconfig.json': `${JSON.stringify(
    {
      extends: '../../tsconfig.json',
      include: ['missing-template.component.ts'],
      exclude: []
    },
    null,
    2
  )}\n`,
  'src/template-refs/inline-child.directive.ts': `
import { Directive } from '@angular/core';

@Directive({
  selector: '[projectChild]',
  exportAs: 'projectChild',
  standalone: true
})
export class InlineChildDirective {
  public label = 'inline';

  public refresh(): void {}
}
`,
  'src/template-refs/inline-parent.component.ts': `
import { Component } from '@angular/core';
import { InlineChildDirective } from './inline-child.directive';

@Component({
  selector: 'project-inline-parent',
  standalone: true,
  imports: [InlineChildDirective],
  template: \`
    <button projectChild #ref="projectChild" (click)="ref.refresh()">
      {{ ref.label }}
    </button>
  \`
})
export class InlineParentComponent {}
`,
  'src/template-refs/external-child.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-external-child',
  standalone: true,
  template: ''
})
export class ExternalChildComponent {
  public label = 'external';

  public refresh(): void {}
}
`,
  'src/template-refs/external-parent.component.ts': `
import { Component } from '@angular/core';
import { ExternalChildComponent } from './external-child.component';

@Component({
  selector: 'project-external-parent',
  standalone: true,
  imports: [ExternalChildComponent],
  templateUrl: './external-parent.component.html'
})
export class ExternalParentComponent {}
`,
  'src/template-refs/external-parent.component.html': `
<project-external-child #ref>{{ ref.label }}</project-external-child>
<button type="button" (click)="ref.refresh()">Refresh</button>
`,
  'src/typed-parent/typed-child.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-typed-child',
  standalone: true,
  template: ''
})
export class TypedChildComponent {
  public status = 'direct';
  public viewStatus = 'view';

  public activate(): void {}

  public open(): void {}
}
`,
  'src/typed-parent/typed-parent.component.ts': `
import { Component, viewChild } from '@angular/core';
import { TypedChildComponent } from './typed-child.component';

@Component({
  selector: 'project-typed-parent',
  standalone: true,
  imports: [TypedChildComponent],
  template: \`
    <project-typed-child #child></project-typed-child>
    {{ inspect(child) }}
    {{ inspectViewChild() }}
    @for (item of items; track item.name) {
      {{ item.name }}
    }
  \`
})
export class TypedParentComponent {
  private readonly child = viewChild.required(TypedChildComponent);
  protected items = [{ name: 'item' }];

  protected inspect(instance: TypedChildComponent): string {
    instance.activate();
    return instance.status;
  }

  protected inspectViewChild(): string {
    this.child().open();
    return this.child().viewStatus;
  }
}
`,
  'src/inheritance/base-panel.directive.ts': `
import { Directive } from '@angular/core';

@Directive({
  selector: '[projectBasePanel]',
  standalone: true
})
export abstract class BasePanelDirective {
  protected title = 'base';

  protected refresh(): void {}
}
`,
  'src/inheritance/derived-panel.component.ts': `
import { Component } from '@angular/core';
import { BasePanelDirective } from './base-panel.directive';

@Component({
  selector: 'project-derived-panel',
  standalone: true,
  template: '{{ render() }}'
})
export class DerivedPanelComponent extends BasePanelDirective {
  protected render(): string {
    this.refresh();
    return this.title;
  }
}
`,
  'src/framework-interface/local-control.component.ts': `
import { Component } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

interface LocalControlValueAccessor extends ControlValueAccessor {}

@Component({
  selector: 'project-local-control',
  standalone: true,
  template: ''
})
export class LocalControlComponent implements LocalControlValueAccessor {
  public writeValue(value: unknown): void {
    void value;
  }

  public registerOnChange(callback: (value: unknown) => void): void {
    void callback;
  }

  public registerOnTouched(callback: () => void): void {
    void callback;
  }

  public setDisabledState(disabled: boolean): void {
    void disabled;
  }
}
`,
  'src/angular-options-failure/base-tsconfig.json': `${JSON.stringify(
    {
      extends: '../../tsconfig.json',
      angularCompilerOptions: {
        strictTemplates: false,
        extendedDiagnostics: {}
      }
    },
    null,
    2
  )}\n`,
  'src/angular-options-failure/tsconfig.json': `${JSON.stringify(
    {
      extends: './base-tsconfig.json',
      include: ['invalid-options.component.ts'],
      exclude: []
    },
    null,
    2
  )}\n`,
  'src/angular-options-failure/invalid-options.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-invalid-angular-options',
  standalone: true,
  template: '{{ used }}'
})
export class InvalidAngularOptionsComponent {
  protected used = 'used';
  public unusedField = 'unused';
}
`,
  'src/framework-interface/project-control.component.ts': `
import { Component } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'project-control',
  standalone: true,
  template: ''
})
export class ProjectControlComponent implements ControlValueAccessor {
  public writeValue(value: unknown): void {
    void value;
  }

  public registerOnChange(callback: (value: unknown) => void): void {
    void callback;
  }

  public registerOnTouched(callback: () => void): void {
    void callback;
  }

  public setDisabledState(disabled: boolean): void {
    void disabled;
  }
}
`,
  'src/unused/unused-control.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-unused-control',
  standalone: true,
  template: \`
    {{ used }}
  \`
})
export class UnusedControlComponent {
  protected used = 'used';
  public unusedPublicField = 'unused';
  protected unusedProtectedField = 'unused';

  public unusedPublicMethod(): void {}

  protected unusedProtectedMethod(): void {}
}
`,
  'src/write-only/write-only-child.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-write-only-child',
  standalone: true,
  template: ''
})
export class WriteOnlyChildComponent {
  public externalValue = 'unused';
}
`,
  'src/write-only/write-only-parent.component.ts': `
import { Component } from '@angular/core';
import { WriteOnlyChildComponent } from './write-only-child.component';

const unrelated = { externalValue: 'other' };
export const unrelatedRead = unrelated.externalValue;

@Component({
  selector: 'project-write-only-parent',
  standalone: true,
  imports: [WriteOnlyChildComponent],
  template: \`
    <project-write-only-child #ref></project-write-only-child>
    <button
      type="button"
      (click)="ref.externalValue = 'written'; write(ref)"
    >
      Write
    </button>
  \`
})
export class WriteOnlyParentComponent {
  protected write(instance: WriteOnlyChildComponent): void {
    instance.externalValue = 'written';
  }
}
`,
  'src/analysis-failure/missing-template.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'project-missing-template',
  standalone: true,
  templateUrl: './missing-template.component.html'
})
export class MissingTemplateComponent {
  public unusedField = 'unused';

  public unusedMethod(): void {}
}
`,
  'src/fake-interface/fake-control.component.ts': `
import { Component } from '@angular/core';

interface ControlValueAccessor {
  writeValue(value: unknown): void;
}

@Component({
  selector: 'project-fake-control',
  standalone: true,
  template: ''
})
export class FakeControlComponent implements ControlValueAccessor {
  public writeValue(value: unknown): void {
    void value;
  }

  public registerOnChange(callback: (value: unknown) => void): void {
    void callback;
  }
}
`
};

for (const [relativeFilename, contents] of Object.entries(fixtureFiles)) {
  writeProjectFile(relativeFilename, contents);
}

async function lintProjectFiles(
  relativeFilenames: string[],
  projectService = true
) {
  const eslint = new ESLint({
    cwd: projectDirectory,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          parser: tseslint.parser,
          parserOptions: projectService
            ? {
                projectService: true,
                tsconfigRootDir: projectDirectory
              }
            : {}
        },
        plugins: {
          'lint-suite-angular': configuredAngularPlugin
        },
        rules: {
          'lint-suite-angular/no-unused-instance-fields': [
            'error',
            { analysis: 'project' }
          ]
        }
      }
    ]
  });
  const results = await eslint.lintFiles(relativeFilenames);

  return results.flatMap((result) => result.messages);
}

async function reportedUnused(relativeFilename: string) {
  return (await lintProjectFiles([relativeFilename])).map(
    ({ messageId, message }) => ({ messageId, message })
  );
}

describe('lint-suite-angular/no-unused-instance-fields project analysis', () => {
  test('accepts child field and method reads through inline and external parent template references, including exportAs', async () => {
    assert.deepEqual(
      await lintProjectFiles([
        'src/template-refs/inline-child.directive.ts',
        'src/template-refs/external-child.component.ts'
      ]),
      []
    );
  });

  test('accepts child field and method reads through typed parent instances and viewChild', async () => {
    assert.deepEqual(
      await lintProjectFiles(['src/typed-parent/typed-child.component.ts']),
      []
    );
  });

  test('accepts protected base field and method reads from an Angular subclass', async () => {
    assert.deepEqual(
      await lintProjectFiles(['src/inheritance/base-panel.directive.ts']),
      []
    );
  });

  test('accepts explicit ControlValueAccessor method implementations', async () => {
    assert.deepEqual(
      await lintProjectFiles([
        'src/framework-interface/project-control.component.ts'
      ]),
      []
    );
  });

  test('accepts ControlValueAccessor methods inherited through a local interface', async () => {
    assert.deepEqual(
      await lintProjectFiles([
        'src/framework-interface/local-control.component.ts'
      ]),
      []
    );
  });

  test('does not report unused members when inherited Angular option diagnostics fail', async () => {
    const messages = await lintProjectFiles([
      'src/angular-options-failure/invalid-options.component.ts'
    ]);

    assert.equal(
      messages.some(
        ({ ruleId }) =>
          ruleId === 'lint-suite-angular/no-unused-instance-fields'
      ),
      false
    );
  });

  test('requires typed parser services for project analysis', async () => {
    await assert.rejects(
      () =>
        lintProjectFiles(
          ['src/framework-interface/project-control.component.ts'],
          false
        ),
      /(parser services|type information|projectService|typed)/i
    );
  });

  test('does not report unused members when Angular project analysis fails', async () => {
    const messages = await lintProjectFiles([
      'src/analysis-failure/missing-template.component.ts'
    ]);

    assert.equal(
      messages.some(
        ({ ruleId }) =>
          ruleId === 'lint-suite-angular/no-unused-instance-fields'
      ),
      false
    );
  });

  test('reports truly unused public and protected fields and methods in project mode', async () => {
    assert.deepEqual(
      await reportedUnused('src/unused/unused-control.component.ts'),
      [
        {
          messageId: 'unusedField',
          message: "Angular instance field 'unusedPublicField' is never read."
        },
        {
          messageId: 'unusedField',
          message:
            "Angular instance field 'unusedProtectedField' is never read."
        },
        {
          messageId: 'unusedMethod',
          message: "Angular instance method 'unusedPublicMethod' is never read."
        },
        {
          messageId: 'unusedMethod',
          message:
            "Angular instance method 'unusedProtectedMethod' is never read."
        }
      ]
    );
  });

  test('reports a child field with only external writes and unrelated same-name reads', async () => {
    assert.deepEqual(
      await reportedUnused('src/write-only/write-only-child.component.ts'),
      [
        {
          messageId: 'unusedField',
          message: "Angular instance field 'externalValue' is never read."
        }
      ]
    );
  });

  test('reports methods matched only by a local fake interface or callback name', async () => {
    assert.deepEqual(
      await reportedUnused('src/fake-interface/fake-control.component.ts'),
      [
        {
          messageId: 'unusedMethod',
          message: "Angular instance method 'writeValue' is never read."
        },
        {
          messageId: 'unusedMethod',
          message: "Angular instance method 'registerOnChange' is never read."
        }
      ]
    );
  });
});
