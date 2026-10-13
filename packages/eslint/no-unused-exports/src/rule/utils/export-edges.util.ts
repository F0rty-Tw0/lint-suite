import { isNamespaceExport } from 'typescript';
import type { ExportDeclaration, NamespaceExport } from 'typescript';

import type {
  EdgeAccumulator,
  ImportEdge,
  ModuleResolver,
  ReExportEdge
} from '../common/no-unused-exports.type.ts';

const addNamespaceExport = (
  clause: NamespaceExport,
  edges: EdgeAccumulator,
  target: string | undefined
): void => {
  const exported = clause.name.text;

  edges.exports.push(exported);
  edges.declared.add(exported);

  if (target === undefined) return;

  const edge: ImportEdge = { target, names: ['*'] };

  edges.imports.push(edge);
};

export const addExportFrom = (
  statement: ExportDeclaration,
  edges: EdgeAccumulator,
  resolve: ModuleResolver
): void => {
  const target = resolve(statement.moduleSpecifier);
  const clause = statement.exportClause;

  if (!clause) {
    if (target !== undefined) edges.starTargets.push(target);

    return;
  }

  if (isNamespaceExport(clause)) {
    addNamespaceExport(clause, edges, target);

    return;
  }

  for (const element of clause.elements) {
    const origin = element.propertyName ?? element.name;
    const exported = element.name.text;

    edges.exports.push(exported);

    if (target === undefined) continue;

    const edge: ReExportEdge = { target, source: origin.text, exported };

    edges.reExports.push(edge);
  }
};

export const addLocalExport = (
  statement: ExportDeclaration,
  edges: EdgeAccumulator
): void => {
  const clause = statement.exportClause;

  if (!clause) return;

  if (isNamespaceExport(clause)) return;

  for (const element of clause.elements) {
    const exported = element.name.text;

    edges.exports.push(exported);
    edges.declared.add(exported);
  }
};
