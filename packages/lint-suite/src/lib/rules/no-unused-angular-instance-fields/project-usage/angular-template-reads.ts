import { readFileSync } from 'node:fs';

import {
  Binary,
  CombinedRecursiveAstVisitor,
  ImplicitReceiver,
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver,
  parseTemplate
} from '@angular/compiler';
import * as compilerCli from '@angular/compiler-cli';
import ts from 'typescript';

type AddDeclaration = (declaration: ts.Declaration) => void;
type IndexedReferenceTarget = {
  readonly kind: number;
  readonly target?: {
    readonly directive: ts.Declaration | null;
  } | null;
};
type IndexedIdentifier = {
  readonly kind: number;
  readonly name: string;
  readonly span: {
    readonly start: number;
  };
  readonly target?: IndexedReferenceTarget | null;
};
type IndexedPropertyIdentifier = IndexedIdentifier & {
  readonly kind: 0;
  readonly target: IndexedReferenceTarget | null;
};
type IndexedComponent = {
  readonly errors: readonly Error[];
  readonly fileUrl: string;
  readonly template: {
    readonly fileUrl: string;
    readonly identifiers: Set<IndexedIdentifier>;
  };
};

type AngularConfiguration = {
  readonly errors: readonly ts.Diagnostic[];
  readonly options: ts.CompilerOptions;
  readonly rootNames: readonly string[];
};
type AngularCompilerCliPublicApi = typeof compilerCli & {
  readonly readConfiguration: (project: string) => AngularConfiguration;
};

const angularCompilerCli = compilerCli as AngularCompilerCliPublicApi;

type ReadChain = {
  readonly names: readonly string[];
  readonly root: PropertyRead;
};

const propertyIdentifierKind = 0;
const referenceIdentifierKind = 5;
const knownForContextIndexErrors: Readonly<Record<string, true>> = {
  'Impossible state: "$index" not found in ""': true,
  'Impossible state: "$first" not found in ""': true,
  'Impossible state: "$last" not found in ""': true,
  'Impossible state: "$even" not found in ""': true,
  'Impossible state: "$odd" not found in ""': true,
  'Impossible state: "$count" not found in ""': true
};

const hasUnexpectedIndexedComponentErrors = (
  errors: readonly Error[]
): boolean =>
  errors.some((error) => knownForContextIndexErrors[error.message] !== true);

class RootCollector extends CombinedRecursiveAstVisitor {
  readonly roots: PropertyRead[] = [];

  override visitPropertyRead(node: PropertyRead, context: unknown): unknown {
    if (
      node.receiver instanceof ImplicitReceiver ||
      node.receiver instanceof ThisReceiver
    ) {
      this.roots.push(node);
    }

    return super.visitPropertyRead(node, context);
  }
}

const readChain = (node: PropertyRead | SafePropertyRead): ReadChain | null => {
  const names: string[] = [];
  let current: PropertyRead | SafePropertyRead = node;

  while (true) {
    names.unshift(current.name);

    if (
      current.receiver instanceof PropertyRead ||
      current.receiver instanceof SafePropertyRead
    ) {
      current = current.receiver;
      continue;
    }

    return (current.receiver instanceof ImplicitReceiver ||
      current.receiver instanceof ThisReceiver) &&
      current instanceof PropertyRead
      ? { names, root: current }
      : null;
  }
};

class ReadCollector extends CombinedRecursiveAstVisitor {
  readonly reads: ReadChain[] = [];

  private record(node: PropertyRead | SafePropertyRead): void {
    const chain = readChain(node);

    if (chain) {
      this.reads.push(chain);
    }
  }

  override visitBinary(node: Binary, context: unknown): unknown {
    if (node.operation !== '=') {
      return super.visitBinary(node, context);
    }

    if (
      node.left instanceof PropertyRead ||
      node.left instanceof SafePropertyRead ||
      node.left instanceof KeyedRead ||
      node.left instanceof SafeKeyedRead
    ) {
      this.visit(node.left.receiver);
    }

    if (node.left instanceof KeyedRead || node.left instanceof SafeKeyedRead) {
      this.visit(node.left.key);
    }

    this.visit(node.right);
    return undefined;
  }

  override visitPropertyRead(node: PropertyRead, context: unknown): unknown {
    this.record(node);
    return super.visitPropertyRead(node, context);
  }

  override visitSafePropertyRead(
    node: SafePropertyRead,
    context: unknown
  ): unknown {
    this.record(node);
    return super.visitSafePropertyRead(node, context);
  }
}

const isAngularComponentDecorator = (
  expression: ts.LeftHandSideExpression,
  checker: ts.TypeChecker
): boolean => {
  const unresolved = checker.getSymbolAtLocation(expression);

  if (!unresolved) {
    return false;
  }

  const symbol =
    (unresolved.flags & ts.SymbolFlags.Alias) === 0
      ? unresolved
      : checker.getAliasedSymbol(unresolved);

  return (
    symbol.getName() === 'Component' &&
    (symbol.declarations ?? []).some((declaration) =>
      declaration
        .getSourceFile()
        .fileName.replaceAll('\\', '/')
        .includes('/node_modules/@angular/core/')
    )
  );
};

const componentMetadata = (
  declaration: ts.Declaration,
  checker: ts.TypeChecker
): ts.ObjectLiteralExpression | null | undefined => {
  if (!ts.canHaveDecorators(declaration)) {
    return undefined;
  }

  for (const decorator of ts.getDecorators(declaration) ?? []) {
    if (
      !ts.isCallExpression(decorator.expression) ||
      !isAngularComponentDecorator(decorator.expression.expression, checker)
    ) {
      continue;
    }

    const metadata = decorator.expression.arguments[0];

    return metadata && ts.isObjectLiteralExpression(metadata) ? metadata : null;
  }

  return undefined;
};

const inlineTemplate = (
  declaration: ts.Declaration,
  checker: ts.TypeChecker
): string | null => {
  const metadata = componentMetadata(declaration, checker);

  if (!metadata) {
    return null;
  }

  for (const property of metadata.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) ||
        ts.isStringLiteralLike(property.name) ||
        ts.isNumericLiteral(property.name)) &&
      property.name.text === 'template'
    ) {
      return ts.isStringLiteralLike(property.initializer)
        ? property.initializer.text
        : null;
    }
  }

  return null;
};

const templateText = (
  declaration: ts.Declaration,
  component: IndexedComponent,
  checker: ts.TypeChecker
): string | null => {
  if (component.template.fileUrl === component.fileUrl) {
    return inlineTemplate(declaration, checker);
  }

  return readFileSync(component.template.fileUrl, 'utf8');
};

const propertyIdentifiers = (
  component: IndexedComponent
): IndexedPropertyIdentifier[] => {
  const identifiers: IndexedPropertyIdentifier[] = [];

  for (const identifier of component.template.identifiers) {
    if (identifier.kind === propertyIdentifierKind) {
      identifiers.push(identifier as IndexedPropertyIdentifier);
    }
  }

  return identifiers.sort((left, right) => left.span.start - right.span.start);
};

const addResolvedPath = (
  declaration: ts.Declaration,
  names: readonly string[],
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration,
  allowMissingRoot: boolean
): boolean => {
  let type = checker.getTypeAtLocation(declaration);

  for (const [index, name] of names.entries()) {
    const symbol = checker.getPropertyOfType(
      checker.getApparentType(type),
      name
    );

    if (!symbol) {
      return index === 0 && allowMissingRoot;
    }

    for (const memberDeclaration of symbol.declarations ?? []) {
      addDeclaration(memberDeclaration);
    }

    type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  }

  return true;
};

const addTemplateReads = (
  declaration: ts.Declaration,
  component: IndexedComponent,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): boolean => {
  const source = templateText(declaration, component, checker);

  if (source === null) {
    return false;
  }

  const parsed = parseTemplate(source, component.template.fileUrl);

  if (parsed.errors?.length) {
    return false;
  }

  const roots = new RootCollector();
  const reads = new ReadCollector();

  for (const node of parsed.nodes) {
    roots.visit(node);
    reads.visit(node);
  }

  roots.roots.sort((left, right) => left.nameSpan.start - right.nameSpan.start);
  const indexedRoots = propertyIdentifiers(component);

  // Parsed expressions and the public index are separate ASTs; ordered roots are their fail-closed join.
  if (
    roots.roots.length !== indexedRoots.length ||
    roots.roots.some((root, index) => root.name !== indexedRoots[index]?.name)
  ) {
    return false;
  }

  const indexedByRoot = new Map<PropertyRead, IndexedPropertyIdentifier>();

  for (const [index, root] of roots.roots.entries()) {
    const identifier = indexedRoots[index];

    if (!identifier) {
      return false;
    }

    indexedByRoot.set(root, identifier);
  }

  for (const chain of reads.reads) {
    const identifier = indexedByRoot.get(chain.root);

    if (!identifier) {
      return false;
    }

    if (identifier.target === null) {
      if (
        !addResolvedPath(
          declaration,
          chain.names,
          checker,
          addDeclaration,
          true
        )
      ) {
        return false;
      }
      continue;
    }

    if (identifier.target.kind !== referenceIdentifierKind) {
      continue;
    }

    const referenceTarget = identifier.target.target;

    if (!referenceTarget) {
      return false;
    }

    const targetDeclaration = referenceTarget.directive;

    if (
      targetDeclaration &&
      !addResolvedPath(
        targetDeclaration,
        chain.names.slice(1),
        checker,
        addDeclaration,
        false
      )
    ) {
      return false;
    }
  }

  return true;
};

const projectComponents = (
  program: ts.Program,
  checker: ts.TypeChecker
): ts.Declaration[] | null => {
  const declarations: ts.Declaration[] = [];
  let valid = true;

  const visit = (node: ts.Node): void => {
    if (ts.isClassLike(node)) {
      const metadata = componentMetadata(node, checker);

      if (metadata === null) {
        valid = false;
      } else if (metadata) {
        declarations.push(node);
      }
    }

    ts.forEachChild(node, visit);
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (
      !sourceFile.isDeclarationFile &&
      !program.isSourceFileFromExternalLibrary(sourceFile)
    ) {
      visit(sourceFile);
    }
  }

  return valid ? declarations : null;
};

export const collectAngularTemplateReads = (
  configFilePath: string,
  addDeclaration: AddDeclaration
): boolean => {
  const configuration = angularCompilerCli.readConfiguration(configFilePath);

  if (
    configuration.errors.some(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
    )
  ) {
    return false;
  }

  const angularProgram = new compilerCli.NgtscProgram(
    configuration.rootNames,
    configuration.options,
    ts.createCompilerHost(configuration.options, true)
  );

  if (
    angularProgram
      .getNgOptionDiagnostics()
      .some(
        (diagnostic: ts.Diagnostic) =>
          diagnostic.category === ts.DiagnosticCategory.Error
      )
  ) {
    return false;
  }

  const indexedComponents = angularProgram.getIndexedComponents() as Map<
    ts.Declaration,
    IndexedComponent
  >;
  const typescriptProgram = angularProgram.getTsProgram();
  const checker = typescriptProgram.getTypeChecker();
  const components = projectComponents(typescriptProgram, checker);

  if (
    !components ||
    components.some((declaration) => !indexedComponents.has(declaration))
  ) {
    return false;
  }

  for (const [declaration, component] of indexedComponents) {
    if (
      hasUnexpectedIndexedComponentErrors(component.errors) ||
      !addTemplateReads(declaration, component, checker, addDeclaration)
    ) {
      return false;
    }
  }

  return true;
};
