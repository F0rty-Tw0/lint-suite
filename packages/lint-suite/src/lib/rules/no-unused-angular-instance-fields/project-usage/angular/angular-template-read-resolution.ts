import {
  R3TargetBinder,
  ThisReceiver,
  TmplAstReference,
  parseTemplate
} from '@angular/compiler';
import type {
  BoundTarget,
  DirectiveMeta,
  TemplateEntity
} from '@angular/compiler';

import { addResolvedPath } from './angular-resolved-path.ts';
import { ReadCollector } from './angular-template-read-chains.ts';
import { addReferenceRead } from './angular-template-references.ts';
import type {
  ReadChain,
  ReadSegment,
  ResolvedPathOptions,
  TemplateReadContext,
  TemplateReadsOptions
} from '../common/project-usage.type.ts';
import { chainText } from '../utils/read-chain-text.util.ts';

type TemplateReadResult = {
  /** True when a `#reference` was resolved through the directive index. */
  readonly usedDirectiveIndex: boolean;
};

/** Every identifier-like token in a text: a superset of what it can read. */
const identifierNames = (text: string): Set<string> => {
  const matches = text.match(/[A-Za-z_$][\w$]*/gu) ?? [];

  return new Set(matches);
};

const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

const unparsedTemplateReads = (
  context: TemplateReadContext,
  source: string,
  error: string | undefined
): TemplateReadResult => {
  const names = identifierNames(source);
  const message = error ?? 'unknown error';
  const reason = `${context.fileName}: template of ${context.className} does not parse (${message})`;

  context.sink.addFallbackNames(names, reason);

  const unparsedReads: TemplateReadResult = { usedDirectiveIndex: false };

  return unparsedReads;
};

const addComponentRead = (
  context: TemplateReadContext,
  names: ReadSegment[]
): void => {
  const { checker, className, declaration, fileName, sink } = context;
  const options: ResolvedPathOptions = {
    allowMissingRoot: true,
    checker,
    declaration,
    names,
    sink
  };
  const isResolved = addResolvedPath(options);

  if (isResolved) return;

  const fallbackNames = names.map((segment) => segment.name);
  const reason = `${fileName}: cannot resolve '${chainText(names)}' on ${className}`;

  sink.addFallbackNames(fallbackNames, reason);
};

const chainEntity = (
  boundTarget: BoundTarget<DirectiveMeta>,
  chain: ReadChain
): TemplateEntity | null => {
  const isThisRead = chain.root.receiver instanceof ThisReceiver;

  if (isThisRead) return null;

  return boundTarget.getExpressionTarget(chain.root);
};

const addChainRead = (
  context: TemplateReadContext,
  reads: ReadCollector,
  boundTarget: BoundTarget<DirectiveMeta>,
  chain: ReadChain
): boolean => {
  const entity = chainEntity(boundTarget, chain);

  if (entity === null) {
    addComponentRead(context, chain.names);

    return false;
  }

  if (!(entity instanceof TmplAstReference)) return false;

  const owner = reads.referenceOwners.get(entity);
  const names = chain.names.slice(1);

  addReferenceRead(context, entity, owner, names);

  return true;
};

export const addTemplateReads = ({
  angularClass,
  checker,
  directives,
  fileName,
  sink,
  source
}: TemplateReadsOptions): TemplateReadResult => {
  const { declaration, scope } = angularClass;
  const className = declaration.name?.text ?? '(anonymous)';
  const context: TemplateReadContext = {
    checker,
    className,
    declaration,
    directives,
    fileName,
    scope,
    sink
  };
  const parsed = parseTemplate(source, fileName);

  if (parsed.errors?.length) {
    const error = parsed.errors[0]?.msg;

    return unparsedTemplateReads(context, source, error);
  }

  const boundTarget = templateBinder.bind({ template: parsed.nodes });
  const reads = new ReadCollector();

  for (const node of parsed.nodes) {
    reads.visit(node);
  }

  let usedDirectiveIndex = false;

  for (const chain of reads.reads) {
    const usedIndex = addChainRead(context, reads, boundTarget, chain);

    usedDirectiveIndex ||= usedIndex;
  }

  const templateReads: TemplateReadResult = { usedDirectiveIndex };

  return templateReads;
};
