import {
  createCssSelectorFromNode,
  parseTemplate,
  R3TargetBinder,
  ThisReceiver,
  TmplAstElement,
  TmplAstReference
} from '@angular/compiler';
import type { DirectiveMeta, TemplateEntity } from '@angular/compiler';
import type { ClassLikeDeclaration, TypeChecker } from 'typescript';

import type {
  AngularClass,
  DirectiveIndex,
  ReadChain,
  ReadSegment,
  ReadSink,
  ReferenceOwner
} from '../common/project-usage.type.js';
import { addResolvedPath } from './angular-resolved-path.js';
import { ReadCollector } from './angular-template-read-chains.js';

type TemplateReadResult = {
  /** True when a `#reference` was resolved through the directive index. */
  readonly usedDirectiveIndex: boolean;
};

/** Every identifier-like token in a text: a superset of what it can read. */
const identifierNames = (text: string): Set<string> => {
  const matches = text.match(/[A-Za-z_$][\w$]*/gu) ?? [];

  return new Set(matches);
};

const segmentText = (segment: ReadSegment): string => {
  const call = segment.called ? '()' : '';

  return `${segment.name}${call}`;
};

const chainText = (names: ReadSegment[]): string => {
  const texts = names.map(segmentText);

  return texts.join('.');
};

const templateBinder = new R3TargetBinder<DirectiveMeta>(null);

/**
 * Classes a `#reference` can resolve to. Candidates come from the whole
 * Program and are narrowed to the component's standalone `imports` when
 * that scope is known; a scope member with `hostDirectives` may expose
 * exportAs names that are not modelled, so it keeps the wider set. Extra
 * candidates only add reads.
 */
const referenceTargets = (
  reference: TmplAstReference,
  owner: ReferenceOwner | undefined,
  directives: DirectiveIndex,
  scope: ClassLikeDeclaration[] | null
): ClassLikeDeclaration[] => {
  const exportAs = reference.value.trim();
  let targets: ClassLikeDeclaration[] = [];

  if (exportAs !== '') {
    const exportedTargets = directives.byExportAs.get(exportAs) ?? [];

    targets = [...exportedTargets];
  } else if (owner instanceof TmplAstElement) {
    directives.componentMatcher.match(
      createCssSelectorFromNode(owner),
      (_selector, declarations) => {
        targets.push(...declarations);
      }
    );
  }

  const scoped =
    scope !== null &&
    !scope.some(
      (declaration) => directives.byDeclaration.get(declaration)?.hostDirectives
    );

  if (!scoped) return targets;

  const scopedTargets = targets.filter((target) => scope.includes(target));

  return scopedTargets;
};

export const addTemplateReads = (
  { declaration, scope }: AngularClass,
  source: string,
  fileName: string,
  checker: TypeChecker,
  sink: ReadSink,
  directives: DirectiveIndex
): TemplateReadResult => {
  const parsed = parseTemplate(source, fileName);
  const className = declaration.name?.text ?? '(anonymous)';

  if (parsed.errors?.length) {
    sink.addFallbackNames(
      identifierNames(source),
      `${fileName}: template of ${className} does not parse (${parsed.errors[0]?.msg ?? 'unknown error'})`
    );

    const unparsedTemplateReads: TemplateReadResult = {
      usedDirectiveIndex: false
    };

    return unparsedTemplateReads;
  }

  const boundTarget = templateBinder.bind({ template: parsed.nodes });
  const reads = new ReadCollector();
  let usedDirectiveIndex = false;

  for (const node of parsed.nodes) {
    reads.visit(node);
  }

  const chainEntity = (chain: ReadChain): TemplateEntity | null => {
    const isThisRead = chain.root.receiver instanceof ThisReceiver;

    if (isThisRead) return null;

    return boundTarget.getExpressionTarget(chain.root);
  };

  for (const chain of reads.reads) {
    const entity = chainEntity(chain);

    if (entity === null) {
      const isResolved = addResolvedPath(
        declaration,
        chain.names,
        checker,
        sink,
        true
      );

      if (!isResolved) {
        sink.addFallbackNames(
          chain.names.map((segment) => segment.name),
          `${fileName}: cannot resolve '${chainText(chain.names)}' on ${className}`
        );
      }

      continue;
    }

    if (!(entity instanceof TmplAstReference)) continue;

    usedDirectiveIndex = true;

    const targets = referenceTargets(
      entity,
      reads.referenceOwners.get(entity),
      directives,
      scope
    );
    const names = chain.names.slice(1);
    const isTargetResolved = (target: ClassLikeDeclaration): boolean => {
      return addResolvedPath(target, names, checker, sink, false);
    };
    const resolved = targets.map(isTargetResolved);
    const hasResolvedTarget = resolved.includes(true);

    if (resolved.length > 0 && !hasResolvedTarget) {
      sink.addFallbackNames(
        names.map((segment) => segment.name),
        `${fileName}: cannot resolve '#${entity.name}.${chainText(names)}' in ${className}`
      );
    }
  }

  const templateReads: TemplateReadResult = { usedDirectiveIndex };

  return templateReads;
};
