import {
  CombinedRecursiveAstVisitor,
  ImplicitReceiver,
  KeyedRead,
  PropertyRead,
  SafeKeyedRead,
  SafePropertyRead,
  ThisReceiver
} from '@angular/compiler';
import type { Binary, BoundTarget, DirectiveMeta } from '@angular/compiler';

type VisitableNode = Parameters<CombinedRecursiveAstVisitor['visit']>[0];

class ReadCollector extends CombinedRecursiveAstVisitor {
  readonly reads = new Set<string>();

  constructor(
    private readonly boundTarget: BoundTarget<DirectiveMeta> | undefined,
    private readonly action: boolean
  ) {
    super();
  }

  private record(node: PropertyRead | SafePropertyRead): void {
    if (node.receiver instanceof ThisReceiver) {
      this.reads.add(node.name);

      return;
    }

    if (
      node.receiver instanceof ImplicitReceiver &&
      (!this.action || node.name !== '$event') &&
      !this.boundTarget?.getExpressionTarget(node)
    ) {
      this.reads.add(node.name);
    }
  }

  override visitBinary(node: Binary, context: unknown): unknown {
    if (node.operation !== '=') return super.visitBinary(node, context);

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

export const collectAngularExpressionReads = (
  nodes: VisitableNode[],
  boundTarget: BoundTarget<DirectiveMeta> | undefined,
  action: boolean
): Set<string> => {
  const collector = new ReadCollector(boundTarget, action);

  for (const node of nodes) {
    collector.visit(node);
  }

  return collector.reads;
};
