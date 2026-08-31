import ts from 'typescript';

type AddDeclaration = (declaration: ts.Declaration) => void;

const isBindingPattern = (node: ts.Node): node is ts.BindingPattern =>
  ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node);

const resolvedSymbol = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol
): ts.Symbol =>
  (symbol.flags & ts.SymbolFlags.Alias) === 0
    ? symbol
    : checker.getAliasedSymbol(symbol);

const addSymbolDeclarations = (
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  addDeclaration: AddDeclaration
): void => {
  for (const declaration of resolvedSymbol(checker, symbol).declarations ??
    []) {
    addDeclaration(declaration);
  }
};

const symbolsForName = (
  checker: ts.TypeChecker,
  type: ts.Type,
  name: string
): ts.Symbol[] => {
  const symbol = checker.getPropertyOfType(checker.getApparentType(type), name);

  if (symbol) {
    return [symbol];
  }

  if (!type.isUnionOrIntersection()) {
    return [];
  }

  const symbols = new Set<ts.Symbol>();

  for (const member of type.types) {
    for (const memberSymbol of symbolsForName(checker, member, name)) {
      symbols.add(memberSymbol);
    }
  }

  return [...symbols];
};

const allPropertySymbols = (
  checker: ts.TypeChecker,
  type: ts.Type
): ts.Symbol[] => {
  const symbols = new Set(
    checker.getPropertiesOfType(checker.getApparentType(type))
  );

  if (type.isUnionOrIntersection()) {
    for (const member of type.types) {
      for (const symbol of allPropertySymbols(checker, member)) {
        symbols.add(symbol);
      }
    }
  }

  return [...symbols];
};

const addNamedProperties = (
  checker: ts.TypeChecker,
  type: ts.Type,
  names: readonly string[] | null,
  addDeclaration: AddDeclaration
): ts.Symbol[] => {
  const symbols = names
    ? names.flatMap((name) => symbolsForName(checker, type, name))
    : allPropertySymbols(checker, type);

  for (const symbol of symbols) {
    addSymbolDeclarations(checker, symbol, addDeclaration);
  }

  return symbols;
};

const literalPropertyNames = (type: ts.Type): string[] | null => {
  if (type.isStringLiteral() || type.isNumberLiteral()) {
    return [String(type.value)];
  }

  if (!type.isUnion()) {
    return null;
  }

  const names: string[] = [];

  for (const member of type.types) {
    const memberNames = literalPropertyNames(member);

    if (!memberNames) {
      return null;
    }

    names.push(...memberNames);
  }

  return names;
};

const propertyName = (
  checker: ts.TypeChecker,
  node: ts.PropertyName
): string[] | null => {
  if (
    ts.isIdentifier(node) ||
    ts.isPrivateIdentifier(node) ||
    ts.isStringLiteralLike(node) ||
    ts.isNumericLiteral(node) ||
    ts.isBigIntLiteral(node)
  ) {
    return [node.text];
  }

  return literalPropertyNames(checker.getTypeAtLocation(node.expression));
};

const isExpressionWrapper = (parent: ts.Node, child: ts.Node): boolean =>
  (ts.isParenthesizedExpression(parent) ||
    ts.isAsExpression(parent) ||
    ts.isTypeAssertionExpression(parent) ||
    ts.isNonNullExpression(parent) ||
    ts.isSatisfiesExpression(parent)) &&
  parent.expression === child;

const isPatternContainer = (parent: ts.Node, child: ts.Node): boolean =>
  (ts.isArrayLiteralExpression(parent) &&
    parent.elements.some((element) => element === child)) ||
  (ts.isObjectLiteralExpression(parent) &&
    parent.properties.some((property) => property === child)) ||
  (ts.isPropertyAssignment(parent) && parent.initializer === child) ||
  (ts.isSpreadAssignment(parent) && parent.expression === child);

const isWriteOnly = (node: ts.Expression): boolean => {
  let current: ts.Node = node;
  let parent = node.parent;

  while (
    parent &&
    (isExpressionWrapper(parent, current) ||
      isPatternContainer(parent, current))
  ) {
    current = parent;
    parent = parent.parent;
  }

  return (
    (ts.isBinaryExpression(parent) &&
      parent.left === current &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
    (ts.isDeleteExpression(parent) && parent.expression === current) ||
    ((ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
      parent.initializer === current)
  );
};

const addPropertyAccessRead = (
  node: ts.PropertyAccessExpression,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isWriteOnly(node)) {
    return;
  }

  const symbol = checker.getSymbolAtLocation(node.name);

  if (symbol) {
    addSymbolDeclarations(checker, symbol, addDeclaration);
  }
};

const addElementAccessRead = (
  node: ts.ElementAccessExpression,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (isWriteOnly(node) || !node.argumentExpression) {
    return;
  }

  addNamedProperties(
    checker,
    checker.getTypeAtLocation(node.expression),
    literalPropertyNames(checker.getTypeAtLocation(node.argumentExpression)),
    addDeclaration
  );
};

const collectBindingPattern = (
  pattern: ts.BindingPattern,
  type: ts.Type,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (ts.isArrayBindingPattern(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (ts.isOmittedExpression(element)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type,
        element.dotDotDotToken ? null : [String(index)],
        addDeclaration
      );

      if (isBindingPattern(element.name)) {
        for (const symbol of symbols) {
          collectBindingPattern(
            element.name,
            checker.getTypeOfSymbolAtLocation(symbol, element),
            checker,
            addDeclaration
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const element of pattern.elements) {
    if (element.dotDotDotToken) {
      for (const symbol of allPropertySymbols(checker, type)) {
        if (!consumed.has(symbol.name)) {
          addSymbolDeclarations(checker, symbol, addDeclaration);
        }
      }
      continue;
    }

    const names = element.propertyName
      ? propertyName(checker, element.propertyName)
      : ts.isIdentifier(element.name)
        ? [element.name.text]
        : null;
    const symbols = addNamedProperties(checker, type, names, addDeclaration);

    for (const name of names ?? []) {
      consumed.add(name);
    }

    if (isBindingPattern(element.name)) {
      for (const symbol of symbols) {
        collectBindingPattern(
          element.name,
          checker.getTypeOfSymbolAtLocation(symbol, element),
          checker,
          addDeclaration
        );
      }
    }
  }
};

const collectAssignmentPattern = (
  pattern: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression,
  type: ts.Type,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (ts.isArrayLiteralExpression(pattern)) {
    for (const [index, element] of pattern.elements.entries()) {
      if (ts.isOmittedExpression(element)) {
        continue;
      }

      const symbols = addNamedProperties(
        checker,
        type,
        ts.isSpreadElement(element) ? null : [String(index)],
        addDeclaration
      );

      if (
        ts.isArrayLiteralExpression(element) ||
        ts.isObjectLiteralExpression(element)
      ) {
        for (const symbol of symbols) {
          collectAssignmentPattern(
            element,
            checker.getTypeOfSymbolAtLocation(symbol, element),
            checker,
            addDeclaration
          );
        }
      }
    }

    return;
  }

  const consumed = new Set<string>();

  for (const property of pattern.properties) {
    if (ts.isSpreadAssignment(property)) {
      for (const symbol of allPropertySymbols(checker, type)) {
        if (!consumed.has(symbol.name)) {
          addSymbolDeclarations(checker, symbol, addDeclaration);
        }
      }
      continue;
    }

    const names = propertyName(checker, property.name);
    const symbols = addNamedProperties(checker, type, names, addDeclaration);

    if (
      ts.isPropertyAssignment(property) &&
      (ts.isArrayLiteralExpression(property.initializer) ||
        ts.isObjectLiteralExpression(property.initializer))
    ) {
      for (const symbol of symbols) {
        collectAssignmentPattern(
          property.initializer,
          checker.getTypeOfSymbolAtLocation(symbol, property),
          checker,
          addDeclaration
        );
      }
    }
    for (const name of names ?? []) {
      consumed.add(name);
    }
  }
};

const collectDestructuringReads = (
  node: ts.Node,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  if (
    isBindingPattern(node) &&
    !(ts.isBindingElement(node.parent) && node.parent.name === node)
  ) {
    const declaration = node.parent;
    const source =
      ts.isVariableDeclaration(declaration) && declaration.initializer
        ? declaration.initializer
        : declaration;

    collectBindingPattern(
      node,
      checker.getTypeAtLocation(source),
      checker,
      addDeclaration
    );
    return;
  }

  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isArrayLiteralExpression(node.left) ||
      ts.isObjectLiteralExpression(node.left))
  ) {
    collectAssignmentPattern(
      node.left,
      checker.getTypeAtLocation(node.right),
      checker,
      addDeclaration
    );
  }
};

const isAngularInterfaceMethod = (symbol: ts.Symbol): boolean =>
  (symbol.declarations ?? []).some(
    (declaration) =>
      ts.isMethodSignature(declaration) &&
      declaration
        .getSourceFile()
        .fileName.replaceAll('\\', '/')
        .includes('/node_modules/@angular/')
  );

const collectAngularInterfaceMethods = (
  node: ts.ClassLikeDeclaration,
  checker: ts.TypeChecker,
  addDeclaration: AddDeclaration
): void => {
  const classType = checker.getTypeAtLocation(node);

  for (const clause of node.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ImplementsKeyword) {
      continue;
    }

    for (const heritageType of clause.types) {
      const type = checker.getTypeAtLocation(heritageType);

      for (const interfaceMethod of type.getProperties()) {
        if (!isAngularInterfaceMethod(interfaceMethod)) {
          continue;
        }

        const implementation = classType.getProperty(interfaceMethod.name);

        if (implementation) {
          addSymbolDeclarations(checker, implementation, addDeclaration);
        }
      }
    }
  }
};

export const collectTypeScriptReads = (
  program: ts.Program,
  addDeclaration: AddDeclaration
): void => {
  const checker = program.getTypeChecker();

  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) {
      addPropertyAccessRead(node, checker, addDeclaration);
    } else if (ts.isElementAccessExpression(node)) {
      addElementAccessRead(node, checker, addDeclaration);
    } else if (ts.isClassLike(node)) {
      collectAngularInterfaceMethods(node, checker, addDeclaration);
    }

    collectDestructuringReads(node, checker, addDeclaration);
    ts.forEachChild(node, visit);
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (
      !sourceFile.isDeclarationFile &&
      !program.isSourceFileFromExternalLibrary(sourceFile) &&
      /\.(?:[cm]?ts|tsx)$/u.test(sourceFile.fileName)
    ) {
      visit(sourceFile);
    }
  }
};
