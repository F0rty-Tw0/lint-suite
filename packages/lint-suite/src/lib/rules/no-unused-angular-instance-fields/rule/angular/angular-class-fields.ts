import type { TSESLint } from '@typescript-eslint/utils';

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
  MessageIds,
  ProjectMemberUsed,
  RuleContext
} from '../common/no-unused-angular-instance-fields.type.js';

type ReportContext = Pick<RuleContext, 'filename' | 'report' | 'sourceCode'>;

export const reportUnusedMembers = (
  context: ReportContext,
  imports: AngularImports,
  classes: ClassEntry[],
  dynamicClasses: DynamicClasses,
  allowEffectFields: boolean,
  projectMemberUsed: ProjectMemberUsed | undefined,
  projectIndexed: () => boolean = () => false
): void => {
  const projectAnalysis = projectMemberUsed !== undefined;
  const localTemplates = !projectAnalysis || !projectIndexed();

  for (const entry of classes) {
    const ngClass = angularClassMetadata(entry.node, imports);
    const isDynamicClass = dynamicClasses.has(entry);

    if (!ngClass || isDynamicClass) continue;

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

    const readsOwnTemplate = ngClass.component && localTemplates;
    const remainingNames = unreadMembers.map((candidate) => candidate.name);
    const requireTemplate = !projectAnalysis;
    const reads = metadataReads(
      ngClass.metadata,
      readsOwnTemplate,
      context.filename,
      remainingNames,
      requireTemplate
    );

    if (!reads) continue;

    for (const candidate of unreadMembers) {
      const isTemplateRead = reads.has(candidate.name);

      if (isTemplateRead) continue;

      const isProjectUsed = projectMemberUsed?.(candidate.node) === true;

      if (isProjectUsed) continue;

      const data = { name: candidate.name };
      const report: TSESLint.ReportDescriptor<MessageIds> = {
        data,
        messageId: candidate.messageId,
        node: candidate.node.key
      };

      context.report(report);
    }
  }
};
