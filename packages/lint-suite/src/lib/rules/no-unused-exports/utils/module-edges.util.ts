import {
  SyntaxKind,
  forEachChild,
  isCallExpression,
  isExportAssignment,
  isExportDeclaration,
  isImportDeclaration,
  isModuleDeclaration,
  isNamespaceImport
} from 'typescript';
import type {
  ImportClause,
  ImportDeclaration,
  Node,
  SourceFile,
  Statement,
  TypeChecker
} from 'typescript';

import { addExportFrom, addLocalExport } from './export-edges.util.ts';
import { exportedNames } from './exported-names.util.ts';
import { moduleTarget } from './module-target.util.ts';
import type {
  EdgeAccumulator,
  FileEdges,
  ImportEdge,
  IsExternalFile,
  ModuleResolver
} from '../common/no-unused-exports.type.ts';

const importNames = (clause: ImportClause | undefined): string[] => {
  if (!clause) return [];

  const names: string[] = [];

  if (clause.name) names.push('default');

  const bindings = clause.namedBindings;

  if (!bindings) return names;

  if (isNamespaceImport(bindings)) {
    names.push('*');

    return names;
  }

  for (const element of bindings.elements) {
    const origin = element.propertyName ?? element.name;

    names.push(origin.text);
  }

  return names;
};

const addImport = (
  statement: ImportDeclaration,
  edges: EdgeAccumulator,
  resolve: ModuleResolver
): void => {
  const target = resolve(statement.moduleSpecifier);

  if (target === undefined) return;

  const names = importNames(statement.importClause);
  const edge: ImportEdge = { target, names };

  edges.imports.push(edge);
};

const DYNAMIC_IMPORT_TEXT = 'import(';

const dynamicImportTarget = (
  node: Node,
  resolve: ModuleResolver
): string | undefined => {
  if (!isCallExpression(node)) return undefined;

  const isDynamicImport = node.expression.kind === SyntaxKind.ImportKeyword;

  if (!isDynamicImport) return undefined;

  return resolve(node.arguments[0]);
};

const collectDynamicImports = (
  node: Node,
  resolve: ModuleResolver,
  targets: string[]
): void => {
  const target = dynamicImportTarget(node, resolve);

  if (target !== undefined) targets.push(target);

  forEachChild(node, (child) => {
    collectDynamicImports(child, resolve, targets);
  });
};

const addDynamicImports = (
  sourceFile: SourceFile,
  edges: EdgeAccumulator,
  resolve: ModuleResolver
): void => {
  const hasDynamicImport = sourceFile.text.includes(DYNAMIC_IMPORT_TEXT);

  if (!hasDynamicImport) return;

  const targets: string[] = [];

  collectDynamicImports(sourceFile, resolve, targets);

  for (const target of targets) {
    const edge: ImportEdge = { target, names: ['*'] };

    edges.imports.push(edge);
  }
};

const addDefaultExport = (edges: EdgeAccumulator): void => {
  edges.exports.push('default');
  edges.declared.add('default');
};

const addDeclaredExports = (
  statement: Statement,
  edges: EdgeAccumulator
): void => {
  for (const name of exportedNames(statement)) {
    edges.exports.push(name);
    edges.declared.add(name);
  }
};

const emptyEdges = (): EdgeAccumulator => {
  const edges: EdgeAccumulator = {
    exports: [],
    declared: new Set(),
    imports: [],
    reExports: [],
    starTargets: []
  };

  return edges;
};

export const moduleEdges = (
  sourceFile: SourceFile,
  checker: TypeChecker,
  isExternal: IsExternalFile
): FileEdges => {
  const resolve: ModuleResolver = (specifier) =>
    moduleTarget(specifier, checker, isExternal);
  const edges = emptyEdges();
  let skipped = false;

  for (const statement of sourceFile.statements) {
    if (isImportDeclaration(statement)) {
      addImport(statement, edges, resolve);
    } else if (isExportDeclaration(statement)) {
      if (statement.moduleSpecifier) addExportFrom(statement, edges, resolve);
      else addLocalExport(statement, edges);
    } else if (isExportAssignment(statement)) {
      if (statement.isExportEquals) skipped = true;
      else addDefaultExport(edges);
    } else if (isModuleDeclaration(statement)) {
      skipped = true;
    } else {
      addDeclaredExports(statement, edges);
    }
  }

  addDynamicImports(sourceFile, edges, resolve);

  const fileEdges: FileEdges = {
    fileName: sourceFile.fileName,
    ...edges,
    skipped
  };

  return fileEdges;
};
