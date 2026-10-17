import { TSESTree } from '@typescript-eslint/utils';
import type { TSESLint } from '@typescript-eslint/utils';

type Reference = TSESLint.Scope.Reference;

type Variable = TSESLint.Scope.Variable;

type ReferenceIdentifier = Reference['identifier'];

const { AST_NODE_TYPES } = TSESTree;

const isImplicitGlobal = (variable: Variable): boolean =>
  variable.defs.length === 0;

const referencesOf = (variable: Variable): Reference[] => variable.references;

const isValueReference = (reference: Reference): boolean =>
  reference.isValueReference;

const identifierOf = (reference: Reference): ReferenceIdentifier =>
  reference.identifier;

const isIdentifier = (node: ReferenceIdentifier): node is TSESTree.Identifier =>
  node.type === AST_NODE_TYPES.Identifier;

const isMemberObject = (identifier: TSESTree.Identifier): boolean => {
  const { parent } = identifier;

  if (parent.type !== AST_NODE_TYPES.MemberExpression) return false;

  return parent.object === identifier;
};

const isCallee = (identifier: TSESTree.Identifier): boolean => {
  const { parent } = identifier;

  if (parent.type !== AST_NODE_TYPES.CallExpression) return false;

  return parent.callee === identifier;
};

const isInTypeQuery = (node: TSESTree.Node): boolean => {
  const { parent } = node;

  if (parent === undefined) return false;

  if (parent.type === AST_NODE_TYPES.TSTypeQuery) return true;

  if (parent.type !== AST_NODE_TYPES.TSQualifiedName) return false;

  const inTypeQuery = isInTypeQuery(parent);

  return inTypeQuery;
};

const isBareValue = (identifier: TSESTree.Identifier): boolean => {
  const memberObject = isMemberObject(identifier);
  const callee = isCallee(identifier);
  const typeQuery = isInTypeQuery(identifier);
  const isBare = !memberObject && !callee && !typeQuery;

  return isBare;
};

export const ambientAliases = (
  globalScope: TSESLint.Scope.Scope,
  names: ReadonlySet<string>
): TSESTree.Identifier[] => {
  const isAmbientName = (identifier: TSESTree.Identifier): boolean =>
    names.has(identifier.name);
  const implicitGlobals = globalScope.variables.filter(isImplicitGlobal);
  const resolved = implicitGlobals.flatMap(referencesOf);
  const references = [...globalScope.through, ...resolved];
  const values = references.filter(isValueReference);
  const referenced = values.map(identifierOf);
  const identifiers = referenced.filter(isIdentifier);
  const ambient = identifiers.filter(isAmbientName);
  const aliases = ambient.filter(isBareValue);

  return aliases;
};
