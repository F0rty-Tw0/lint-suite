import * as compilerCli from '@angular/compiler-cli';
import type { AngularCompilerOptions } from '@angular/compiler-cli';
import { createCompilerHost, DiagnosticCategory } from 'typescript';
import type { Declaration, Diagnostic } from 'typescript';

import type { IndexedComponent } from '../common/angular-index.type.js';
import type { AddDeclaration } from '../common/project-usage.type.js';
import { isSpecFile } from '../utils/spec-file.js';
import { addTemplateReads } from './angular-template-read-resolution.js';
import { projectComponents } from './angular-component-discovery.js';

type AngularConfiguration = {
  readonly errors: Diagnostic[];
  readonly options: AngularCompilerOptions;
  readonly rootNames: string[];
};

type CompilerCliWithReadConfiguration = {
  readonly readConfiguration: (project: string) => AngularConfiguration;
};

const hasReadConfiguration = (
  value: object
): value is CompilerCliWithReadConfiguration =>
  'readConfiguration' in value &&
  typeof value.readConfiguration === 'function';

const contextIndexErrorPattern = /^Impossible state: "(.+)" not found in "/u;

const missingContextRootNames = (errors: Error[]): Set<string> | null => {
  const names = new Set<string>();

  for (const error of errors) {
    const match = contextIndexErrorPattern.exec(error.message);

    if (!match?.[1]) {
      return null;
    }

    names.add(match[1]);
  }

  return names;
};

export const collectAngularTemplateReads = (
  configFilePath: string,
  addDeclaration: AddDeclaration
): string[] | null => {
  if (!hasReadConfiguration(compilerCli)) {
    return null;
  }

  const configuration = compilerCli.readConfiguration(configFilePath);

  if (
    configuration.errors.some(
      (diagnostic: Diagnostic) =>
        diagnostic.category === DiagnosticCategory.Error
    )
  ) {
    return null;
  }

  const angularProgram = new compilerCli.NgtscProgram(
    configuration.rootNames,
    configuration.options,
    createCompilerHost(configuration.options, true)
  );

  if (
    angularProgram
      .getNgOptionDiagnostics()
      .some(
        (diagnostic: Diagnostic) =>
          diagnostic.category === DiagnosticCategory.Error
      )
  ) {
    return null;
  }

  const indexedComponents = angularProgram.getIndexedComponents() as Map<
    Declaration,
    IndexedComponent
  >;
  const typescriptProgram = angularProgram.getTsProgram();
  const checker = typescriptProgram.getTypeChecker();
  const components = projectComponents(typescriptProgram, checker);

  if (
    !components ||
    components.some((declaration) => !indexedComponents.has(declaration))
  ) {
    return null;
  }

  const templateFiles = new Set<string>();

  for (const [declaration, component] of indexedComponents) {
    if (isSpecFile(declaration.getSourceFile().fileName)) {
      continue;
    }

    const missingRootNames = missingContextRootNames(component.errors);

    if (!missingRootNames) {
      return null;
    }

    if (
      !addTemplateReads(
        declaration,
        component,
        checker,
        addDeclaration,
        missingRootNames
      )
    ) {
      return null;
    }

    if (component.template.fileUrl !== component.fileUrl) {
      templateFiles.add(component.template.fileUrl);
    }
  }

  return [...templateFiles];
};
