import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';

import { Linter, RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { TSESTree } from '@typescript-eslint/utils';

import { angular } from '../../../angular.js';
import {
  addAngularImport,
  reportUnusedMembers
} from './angular/angular-class-fields.js';

const angularPlugin = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean);
const rule = angularPlugin?.rules?.['no-unused-instance-fields'];

assert.ok(
  rule,
  'angular preset must register lint-suite-angular/no-unused-instance-fields'
);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const parser = tseslint.parser;
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', parser, sourceType: 'module' }
});
const externalTemplateDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-')
);
const externalComponentFilename = join(
  externalTemplateDirectory,
  'external.component.ts'
);

writeFileSync(
  join(externalTemplateDirectory, 'external.component.html'),
  '{{ fromTemplate }}'
);
after(() =>
  rmSync(externalTemplateDirectory, { force: true, recursive: true })
);

function component(
  body: string,
  metadata = "template: ''",
  imports = 'Component',
  decorator = 'Component',
  classDeclaration = 'class TestComponent'
) {
  return `import { ${imports} } from '@angular/core'; @${decorator}({ ${metadata} }) ${classDeclaration} { ${body} }`;
}

const projectDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-project-')
);
const failingProjectDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-failing-project-')
);
const cacheProjectDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-cache-project-')
);
const projectPropertyComponentFilename = join(
  projectDirectory,
  'project-property.component.ts'
);
const projectElementComponentFilename = join(
  projectDirectory,
  'project-element.component.ts'
);
const projectDestructuringComponentFilename = join(
  projectDirectory,
  'project-destructuring.component.ts'
);
const projectTemplateDirectiveFilename = join(
  projectDirectory,
  'project-template.directive.ts'
);
const projectUnreadComponentFilename = join(
  projectDirectory,
  'project-unread.component.ts'
);
const projectSpecFilename = join(projectDirectory, 'project-excluded.spec.ts');
const failingProjectComponentFilename = join(
  failingProjectDirectory,
  'project-index-failure.component.ts'
);
const failingProjectBrokenComponentFilename = join(
  failingProjectDirectory,
  'project-index-broken.component.ts'
);
const cacheProjectComponentFilename = join(
  cacheProjectDirectory,
  'project-template-cache.component.ts'
);
const cacheProjectTemplateFilename = join(
  cacheProjectDirectory,
  'project-template-cache.component.html'
);
const angularCoreDeclarations = `
  export declare function Component(metadata: Record<string, unknown>): ClassDecorator;
  export declare function Directive(metadata: Record<string, unknown>): ClassDecorator;
`;

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

writeAngularCoreFixture(projectDirectory);
writeFileSync(join(projectDirectory, 'tsconfig.json'), projectTsconfig);
writeAngularCoreFixture(failingProjectDirectory);
writeFileSync(join(failingProjectDirectory, 'tsconfig.json'), projectTsconfig);
writeAngularCoreFixture(cacheProjectDirectory);
writeFileSync(join(cacheProjectDirectory, 'tsconfig.json'), projectTsconfig);

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
const cacheProjectComponentCode = `
  import { Component } from '@angular/core';

  @Component({ templateUrl: './project-template-cache.component.html' })
  export class ProjectTemplateCacheComponent {
    readonly readFromTemplateCache = 'used';
  }
`;

writeFileSync(projectPropertyComponentFilename, projectPropertyComponentCode);
writeFileSync(
  join(projectDirectory, 'project-property.consumer.ts'),
  `
    import { ProjectPropertyComponent } from './project-property.component';

    declare const component: ProjectPropertyComponent;
    void component.readFromProperty;
  `
);
writeFileSync(projectElementComponentFilename, projectElementComponentCode);
writeFileSync(
  join(projectDirectory, 'project-element.consumer.ts'),
  `
    import { ProjectElementComponent } from './project-element.component';

    declare const component: ProjectElementComponent;
    void component['readFromElement'];
  `
);
writeFileSync(
  projectDestructuringComponentFilename,
  projectDestructuringComponentCode
);
writeFileSync(
  join(projectDirectory, 'project-destructuring.consumer.ts'),
  `
    import { ProjectDestructuringComponent } from './project-destructuring.component';

    declare const component: ProjectDestructuringComponent;
    const { readFromDestructuring } = component;
    void readFromDestructuring;
  `
);
writeFileSync(projectTemplateDirectiveFilename, projectTemplateDirectiveCode);
writeFileSync(projectUnreadComponentFilename, projectUnreadComponentCode);
writeFileSync(cacheProjectComponentFilename, cacheProjectComponentCode);
writeFileSync(cacheProjectTemplateFilename, '{{ readFromTemplateCache }}');
writeFileSync(projectSpecFilename, projectSpecCode);
writeFileSync(failingProjectComponentFilename, failingProjectComponentCode);
writeFileSync(
  failingProjectBrokenComponentFilename,
  failingProjectBrokenComponentCode
);

after(() => {
  rmSync(projectDirectory, { force: true, recursive: true });
  rmSync(failingProjectDirectory, { force: true, recursive: true });
  rmSync(cacheProjectDirectory, { force: true, recursive: true });
});

const projectRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: projectDirectory
    },
    sourceType: 'module'
  }
});
const failingProjectRuleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: failingProjectDirectory
    },
    sourceType: 'module'
  }
});

const cacheProjectConfig: Linter.Config = {
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: cacheProjectDirectory
    },
    sourceType: 'module'
  },
  plugins: {
    'lint-suite-angular': {
      rules: { 'no-unused-instance-fields': rule }
    }
  },
  rules: {
    'lint-suite-angular/no-unused-instance-fields': [
      'error',
      { analysis: 'project' }
    ]
  }
};

const externalTemplateCase = {
  name: 'accepts a field read by an external template',
  filename: externalComponentFilename,
  code: component(
    `protected fromTemplate = 'used';`,
    `templateUrl: './external.component.html'`
  )
};

ruleTester.run('lint-suite-angular/no-unused-instance-fields', rule, {
  valid: [
    {
      name: 'ignores fields outside Angular components and directives',
      code: `class Service { private unused = 'unused'; }`
    },
    {
      name: 'accepts a field read by class TypeScript',
      code: component(
        `private value = 'used'; public read(): string { return this.value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read through object destructuring from this',
      code: component(
        `private value = 'used'; public read(): string { const { value } = this; return value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read through a non-null this receiver',
      code: component(
        `private value = 'used'; public read(): string { return this!.value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read by an inline template',
      code: component(
        `protected fromTemplate = 'used';`,
        `template: '{{ fromTemplate }}'`
      )
    },
    externalTemplateCase,
    {
      name: 'accepts fields read by host property and event expressions',
      code: component(
        `protected title = 'used'; protected callback = () => undefined;`,
        `template: '', host: { '[attr.title]': 'title', '(click)': 'callback()' }`
      )
    },
    {
      name: 'accepts this.$event in a host action as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': 'this.$event' }`
      )
    },
    {
      name: 'accepts a host action whose nested write reads the component receiver',
      code: component(
        `protected state = { value: false };`,
        `template: '', host: { '(click)': 'state.value = true' }`
      )
    },
    {
      name: 'accepts a field read through lexical this in an arrow function',
      code: component(
        `private value = ''; public read(): string { const nested = (): string => this.value; return nested(); }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a method read by TypeScript',
      code: component(
        `private used(): void {} ngOnInit(): void { this.used(); }`
      )
    },
    {
      name: 'accepts a method read by an inline template',
      code: component(
        `private fromTemplate(): string { return 'used'; }`,
        `template: '{{ fromTemplate() }}'`
      )
    },
    {
      name: 'accepts a method read by a host expression',
      code: component(
        `protected onClick(): void {}`,
        `template: '', host: { '(click)': 'onClick()' }`
      )
    },
    {
      name: 'conservatively ignores externally exposed directive methods',
      code: component(
        `public externallyReadable(): void {}`,
        `selector: '[example]', exportAs: 'example'`,
        'Directive',
        'Directive'
      )
    },
    {
      name: 'exempts lifecycle and non-concrete method kinds',
      code: `import { Component, Input } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          constructor() {} get value(): string { return ''; } set value(next: string) {}
          static shared(): void {} override inherited(): void {} @Input() decorated(): void {}
          ['computed'](): void {} ngOnChanges(): void {} ngOnInit(): void {} ngDoCheck(): void {}
          ngAfterContentInit(): void {} ngAfterContentChecked(): void {} ngAfterViewInit(): void {}
          ngAfterViewChecked(): void {} ngOnDestroy(): void {}
        }
        @Component({ template: '' }) abstract class AbstractComponent {
          abstract pending(): void;
        }
        @Component({ template: '' }) declare class DeclaredComponent {
          declared(): void;
        }`
    },
    {
      name: 'exempts Angular signal APIs and decorator-managed fields',
      code: component(
        `@Input() public decoratedInput = ''; @ViewChild('content') private content: unknown;
        public signalInput = inputSignal(''); public signalOutput = output<void>(); public signalModel = model(false);`,
        "template: ''",
        'Component, Input, ViewChild, input as inputSignal, model, output'
      )
    },
    {
      name: 'exempts static and non-concrete fields',
      code: `
        import { Component } from '@angular/core';
        class Base { public inherited = ''; }
        @Component({ template: '' }) abstract class TestComponent extends Base {
          public static shared = ''; public abstract pending: string;
          public declare supplied: string; public override inherited = '';
        }
      `
    },
    {
      name: 'conservatively ignores externally exposed directive fields',
      code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]', exportAs: 'example' })
        class TestDirective { public externallyReadable = 'used'; }`
    },
    {
      name: 'accepts an unread Angular effect field when allowEffectFields is true',
      code: component(
        `private readonly cleanup = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows auto-cleaned Angular effect fields with no call options when enabled',
      code: component(
        `private readonly titleEffect = createEffect(() => undefined);`,
        `template: ''`,
        'Component, effect as createEffect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows auto-cleaned Angular effect fields with known inline options when enabled',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { injector: undefined });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows namespace-imported auto-cleaned Angular effect fields when enabled',
      code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          private readonly titleEffect = ng.effect(() => undefined);
        }`,
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'treats Angular signal query fields as managed',
      code: component(
        `private readonly view = viewChild<unknown>('view');
        private readonly views = viewChildren<unknown>('view');
        private readonly content = contentChild<unknown>('content');
        private readonly contents = contentChildren<unknown>('content');`,
        `template: ''`,
        'Component, viewChild, viewChildren, contentChild, contentChildren'
      )
    }
  ],
  invalid: [
    {
      name: 'reports both demonstration component fields',
      code: `import { Component, inject } from '@angular/core'; class IconService {}
        @Component({ template: '' }) class AboutComponent {
          private readonly test = inject(IconService); public test2 = 'test2';
        }`,
      errors: [
        { messageId: 'unusedField', data: { name: 'test' } },
        { messageId: 'unusedField', data: { name: 'test2' } }
      ]
    },
    {
      name: 'reports an unread public component method',
      code: component(`public unusedMethod(): void {}`),
      errors: [{ messageId: 'unusedMethod', data: { name: 'unusedMethod' } }]
    },
    {
      name: 'does not count a TypeScript write as a read',
      code: component(
        `private value = ''; public update(): void { this.value = 'written'; }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'reports a private unused directive field',
      code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]' })
        class TestDirective { private internalOnly = 'unused'; }`,
      errors: [{ messageId: 'unusedField', data: { name: 'internalOnly' } }]
    },
    {
      name: 'reports a private unused directive method',
      code: component(
        `private internalOnly(): void {}`,
        `selector: '[example]'`,
        'Directive',
        'Directive'
      ),
      errors: [{ messageId: 'unusedMethod', data: { name: 'internalOnly' } }]
    },
    {
      name: 'does not count a foreign object member read as a component field read',
      code: component(
        `private value = ''; public read(other: { value: string }): string { return other.value; }`,
        `template: '{{ read() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count an object-destructuring assignment as a component field read',
      code: component(
        `private value = ''; public update(source: { value: string }): void { ({ value: this.value } = source); }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count a host action write as a component field read',
      code: component(
        `private value = false;`,
        `template: '', host: { '(click)': 'value = true' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'reports only a field unread by both host and template',
      code: component(
        `private hostRead = ''; private templateRead = ''; private unused = '';`,
        `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    },
    {
      name: 'reports an unused field in a namespace-imported component',
      code: `import * as ng from '@angular/core'; @ng.Component({ template: '' })
        class TestComponent { private unused = ''; }`,
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    },
    {
      name: 'does not count an Angular template local as a component field read',
      code: component(
        `private item = ''; protected items = input<string[]>([]);`,
        "template: '@for (item of items; track item) { {{ item }} }'",
        'Component, input'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'item' } }]
    },
    {
      name: 'does not count this inside a nested normal function as a component field read',
      code: component(
        `private value = ''; public read(): string { function nested(): string { return this.value; } return nested(); }`,
        `template: '{{ read() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count an Angular host action event local as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': '$event.stopPropagation()' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: '$event' } }]
    },
    {
      name: 'reports auto-cleaned Angular effect fields when allowEffectFields is omitted',
      code: component(
        `private readonly titleEffect = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports an unread Angular effect field when allowEffectFields is false',
      code: component(
        `private readonly cleanup = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: false }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports an unread same-named non-Angular effect field when allowEffectFields is true',
      code: `import { Component } from '@angular/core';
        function effect(callback: () => void): unknown { callback(); return {}; }
        @Component({ template: '' }) class TestComponent {
          private readonly cleanup = effect(() => undefined);
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports an unread Angular effect field shadowed by an enclosing parameter when allowEffectFields is true',
      code: `import { Component, effect } from '@angular/core';
        function createComponent(effect: unknown) {
          @Component({ template: '' }) class TestComponent {
            private readonly cleanup = effect(() => undefined);
          }
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports manual-cleanup Angular effect fields when enabled',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { manualCleanup: true });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when variable options may require manual cleanup',
      code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, effectOptions);
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when inline options have an unknown spread',
      code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { ...effectOptions });
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when inline options have an unknown computed property',
      code: `import { Component, effect } from '@angular/core';
        const cleanupOption = 'manualCleanup';
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { [cleanupOption]: true });
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields with a string-keyed manual cleanup option',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { 'manualCleanup': true });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports unread subscription fields when allowEffectFields is enabled',
      code: component(
        `private readonly subscription = ({ subscribe: () => undefined }).subscribe();`
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'subscription' } }]
    },
    {
      name: 'reports unread fields whose local type is named ComponentRef',
      code: `import { Component } from '@angular/core';
        interface ComponentRef {}
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`,
      errors: [{ messageId: 'unusedField', data: { name: 'ref' } }]
    }
  ]
});

test('resolves inline template reads before project member lookup', () => {
  const ast = parser.parseForESLint(
    component(
      `private readonly fromTemplate = 'used';`,
      `template: '{{ fromTemplate }}'`
    )
  ).ast as TSESTree.Program;
  const angularImport = ast.body.find(
    (node): node is TSESTree.ImportDeclaration =>
      node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration
  );
  const componentClass = ast.body.find(
    (node) => node.type === TSESTree.AST_NODE_TYPES.ClassDeclaration
  );

  assert.ok(angularImport);
  assert.ok(componentClass);

  const imports = new Map<string, string | null>();
  const entry = { node: componentClass, reads: new Set<string>() };
  let reports = 0;
  let projectLookupCalls = 0;

  addAngularImport(angularImport, imports);
  reportUnusedMembers(
    {
      filename: 'component.ts',
      report: (): void => {
        reports += 1;
      }
    } as unknown as Parameters<typeof reportUnusedMembers>[0],
    imports,
    [entry],
    new Set<typeof entry>(),
    false,
    (): boolean => {
      projectLookupCalls += 1;
      return false;
    }
  );

  assert.equal(reports, 0);
  assert.equal(projectLookupCalls, 0);
});

test('requires parser services for project analysis', () => {
  const linter = new Linter();

  assert.throws(
    () =>
      linter.verify(component(`private readonly unread = 'unused';`), {
        languageOptions: {
          ecmaVersion: 'latest',
          parser,
          sourceType: 'module'
        },
        plugins: {
          'lint-suite-angular': {
            rules: { 'no-unused-instance-fields': rule }
          }
        },
        rules: {
          'lint-suite-angular/no-unused-instance-fields': [
            'error',
            { analysis: 'project' }
          ]
        }
      }),
    /parser services/i
  );
});

test('invalidates project template usage after external template changes', () => {
  const linter = new Linter({ cwd: cacheProjectDirectory });
  const originalTemplate = readFileSync(cacheProjectTemplateFilename, 'utf8');
  const originalStats = statSync(cacheProjectTemplateFilename);
  const changedTime = new Date(
    Math.max(Date.now(), originalStats.mtimeMs) + 2_000
  );

  try {
    assert.deepEqual(
      linter.verify(cacheProjectComponentCode, cacheProjectConfig, {
        filename: cacheProjectComponentFilename
      }),
      []
    );

    writeFileSync(cacheProjectTemplateFilename, '<p></p>');
    utimesSync(cacheProjectTemplateFilename, changedTime, changedTime);

    assert.deepEqual(
      linter
        .verify(cacheProjectComponentCode, cacheProjectConfig, {
          filename: cacheProjectComponentFilename
        })
        .map(({ message, messageId, ruleId }) => ({
          message,
          messageId,
          ruleId
        })),
      [
        {
          message:
            "Angular instance field 'readFromTemplateCache' is never read.",
          messageId: 'unusedField',
          ruleId: 'lint-suite-angular/no-unused-instance-fields'
        }
      ]
    );
  } finally {
    writeFileSync(cacheProjectTemplateFilename, originalTemplate);
    utimesSync(
      cacheProjectTemplateFilename,
      originalStats.atime,
      originalStats.mtime
    );
  }
});

projectRuleTester.run('lint-suite-angular/no-unused-instance-fields', rule, {
  valid: [
    {
      name: 'accepts a field read by a property access in another project file',
      code: projectPropertyComponentCode,
      filename: projectPropertyComponentFilename,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a field read by an element access in another project file',
      code: projectElementComponentCode,
      filename: projectElementComponentFilename,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a field read by destructuring in another project file',
      code: projectDestructuringComponentCode,
      filename: projectDestructuringComponentFilename,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a directive field read by an Angular template in project mode',
      code: projectTemplateDirectiveCode,
      filename: projectTemplateDirectiveFilename,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'excludes spec files from project-mode reports',
      code: projectSpecCode,
      filename: projectSpecFilename,
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: [
    {
      name: 'reports unread fields after a successful project analysis',
      code: projectUnreadComponentCode,
      filename: projectUnreadComponentFilename,
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadInProject' } }]
    }
  ]
});

failingProjectRuleTester.run(
  'lint-suite-angular/no-unused-instance-fields',
  rule,
  {
    valid: [
      {
        name: 'skips reports when the project index cannot be built',
        code: failingProjectComponentCode,
        filename: failingProjectComponentFilename,
        options: [{ analysis: 'project' }]
      }
    ],
    invalid: []
  }
);
