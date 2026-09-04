import { angularClassMetadata } from './angular-imports.js';
import {
  fieldCandidate,
  implementedFormsMethods,
  methodCandidate
} from './angular-member-candidates.js';
import { metadataReads } from './angular-metadata-reads.js';
import type {
  AngularImports,
  ClassEntry,
  DynamicClasses,
  MemberCandidate,
  ProjectMemberUsed,
  RuleContext
} from '../common/no-unused-angular-instance-fields.type.js';

export const reportUnusedMembers = (
  context: RuleContext,
  imports: AngularImports,
  classes: ClassEntry[],
  dynamicClasses: DynamicClasses,
  allowEffectFields: boolean,
  projectMemberUsed: ProjectMemberUsed | undefined,
  projectIndexed: () => boolean = () => false
): void => {
  const projectAnalysis = projectMemberUsed !== undefined;
  // ponytail: local template reads short-circuit project lookups, but once
  // the project index already covers this Program they only repeat work.
  const localTemplates = !projectAnalysis || !projectIndexed();

  for (const entry of classes) {
    const ngClass = angularClassMetadata(entry.node, imports);
    const isDynamicClass = dynamicClasses.has(entry);

    if (!ngClass || isDynamicClass) continue;

    // ponytail: local analysis cannot see subclasses, so directive and
    // abstract-class members are only candidates when private.
    const localPrivateOnly =
      !projectAnalysis && (!ngClass.component || entry.node.abstract === true);
    const implementedMethods = implementedFormsMethods(entry.node);
    const members: MemberCandidate[] = [];

    for (const node of entry.node.body.body) {
      const candidate =
        fieldCandidate(
          node,
          imports,
          localPrivateOnly,
          allowEffectFields,
          context.sourceCode
        ) ?? methodCandidate(node, localPrivateOnly, implementedMethods);

      if (candidate) {
        members.push(candidate);
      }
    }

    if (members.length === 0) continue;

    const unreadMembers = members.filter(
      (candidate) => !entry.reads.has(candidate.name)
    );

    if (unreadMembers.length === 0) continue;

    // ponytail: project analysis indexes the component's own template with
    // type information, so a template that cannot be read locally (for
    // example `templateUrl: URL`) defers to the index instead of failing.
    const reads = metadataReads(
      ngClass.metadata,
      ngClass.component && localTemplates,
      context.filename,
      unreadMembers.map((candidate) => candidate.name),
      !projectAnalysis
    );

    if (!reads) continue;

    for (const candidate of unreadMembers) {
      const isTemplateRead = reads.has(candidate.name);

      if (isTemplateRead) continue;

      const isProjectUsed = projectMemberUsed?.(candidate.node) === true;

      if (isProjectUsed) continue;

      context.report({
        data: { name: candidate.name },
        messageId: candidate.messageId,
        node: candidate.node.key
      });
    }
  }
};
