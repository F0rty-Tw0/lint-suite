import { TSESTree } from '@typescript-eslint/utils';

type ExportNodes = Map<string, TSESTree.Node>;

type NamedDeclaration = Exclude<
  TSESTree.NamedExportDeclarations,
  TSESTree.VariableDeclaration
>;

const { AST_NODE_TYPES } = TSESTree;

const exportedName = (
  exported: TSESTree.Identifier | TSESTree.StringLiteral
): string => {
  if (exported.type === AST_NODE_TYPES.Identifier) return exported.name;

  return exported.value;
};

const addVariableNodes = (
  declaration: TSESTree.VariableDeclaration,
  nodes: ExportNodes
): void => {
  for (const declarator of declaration.declarations) {
    const { id } = declarator;

    if (id.type !== AST_NODE_TYPES.Identifier) continue;

    nodes.set(id.name, id);
  }
};

const addNamedDeclarationNode = (
  declaration: NamedDeclaration,
  nodes: ExportNodes
): void => {
  const { id } = declaration;

  if (!id) return;

  if (id.type !== AST_NODE_TYPES.Identifier) return;

  nodes.set(id.name, id);
};

const addNamedExportNodes = (
  statement: TSESTree.ExportNamedDeclaration,
  nodes: ExportNodes
): void => {
  for (const specifier of statement.specifiers) {
    const name = exportedName(specifier.exported);

    nodes.set(name, specifier);
  }

  const { declaration } = statement;

  if (!declaration) return;

  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    addVariableNodes(declaration, nodes);

    return;
  }

  addNamedDeclarationNode(declaration, nodes);
};

export const exportNodes = (program: TSESTree.Program): ExportNodes => {
  const nodes: ExportNodes = new Map();

  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      nodes.set('default', statement);
      continue;
    }

    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) continue;

    addNamedExportNodes(statement, nodes);
  }

  return nodes;
};
