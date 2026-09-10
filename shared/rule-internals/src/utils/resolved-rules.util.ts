import type { ChildNode, Container, Root, Rule } from 'postcss';

import { resolveSelectors } from '../selector-classes.ts';

type ResolvedRuleVisitor = (
  rule: Rule,
  resolved: string[],
  parents: string[]
) => void;

const walkContainer = (
  container: Container<ChildNode>,
  parents: string[],
  visit: ResolvedRuleVisitor
): void => {
  for (const node of container.nodes ?? []) {
    if (node.type === 'rule') {
      const resolved = resolveSelectors(node.selectors, parents);

      visit(node, resolved, parents);
      walkContainer(node, resolved, visit);
      continue;
    }

    if (node.type !== 'atrule') continue;

    walkContainer(node, parents, visit);
  }
};

export const walkResolvedRules = (
  root: Root,
  visit: ResolvedRuleVisitor
): void => {
  walkContainer(root, [], visit);
};
