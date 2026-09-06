import {
  SyntaxKind,
  canHaveModifiers,
  getModifiers,
  isClassDeclaration,
  isEnumDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isInterfaceDeclaration,
  isTypeAliasDeclaration,
  isVariableStatement
} from 'typescript';
import type { Statement, VariableStatement } from 'typescript';

const hasModifier = (statement: Statement, kind: SyntaxKind): boolean => {
  if (!canHaveModifiers(statement)) return false;

  const modifiers = getModifiers(statement);
  const matched = modifiers?.some((modifier) => modifier.kind === kind);

  return matched === true;
};

const variableNames = (statement: VariableStatement): string[] => {
  const names: string[] = [];

  for (const declaration of statement.declarationList.declarations) {
    if (!isIdentifier(declaration.name)) continue;

    names.push(declaration.name.text);
  }

  return names;
};

const declaredName = (statement: Statement): string | undefined => {
  if (isFunctionDeclaration(statement)) return statement.name?.text;

  if (isClassDeclaration(statement)) return statement.name?.text;

  if (isTypeAliasDeclaration(statement)) return statement.name.text;

  if (isInterfaceDeclaration(statement)) return statement.name.text;

  if (isEnumDeclaration(statement)) return statement.name.text;

  return undefined;
};

export const exportedNames = (statement: Statement): string[] => {
  const isExported = hasModifier(statement, SyntaxKind.ExportKeyword);

  if (!isExported) return [];

  const isDefault = hasModifier(statement, SyntaxKind.DefaultKeyword);

  if (isDefault) return ['default'];

  if (isVariableStatement(statement)) return variableNames(statement);

  const name = declaredName(statement);

  if (name === undefined) return [];

  return [name];
};
