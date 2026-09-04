import type { TSESLint } from '@typescript-eslint/utils';

import { angularClassMetadata } from './angular-imports.ts';
import {
  fieldCandidate,
  implementedFormsMethods,
  methodCandidate
} from './angular-member-candidates.ts';
import { metadataReads } from './angular-metadata-reads.ts';
import type {
  AngularClassMetadata,
  AngularClassNode,
  ClassEntry,
  FieldCandidateOptions,
  MemberCandidate,
  MessageIds,
  MetadataReadsOptions,
  ReportContext,
  ReportUnusedMembersOptions
} from '../common/no-unused-angular-instance-fields.type.ts';

type ClassReportOptions = {
  readonly localTemplates: boolean;
  readonly options: ReportUnusedMembersOptions;
  readonly projectAnalysis: boolean;
};

const memberCandidates = (
  node: AngularClassNode,
  options: FieldCandidateOptions
): MemberCandidate[] => {
  const implementedMethods = implementedFormsMethods(node);
  const members: MemberCandidate[] = [];

  for (const element of node.body.body) {
    const candidate =
      fieldCandidate(element, options) ??
      methodCandidate(element, options.localPrivateOnly, implementedMethods);

    if (candidate) {
      members.push(candidate);
    }
  }

  return members;
};

const reportMember = (
  context: ReportContext,
  candidate: MemberCandidate
): void => {
  const data = { name: candidate.name };
  const report: TSESLint.ReportDescriptor<MessageIds> = {
    data,
    messageId: candidate.messageId,
    node: candidate.node.key
  };

  context.report(report);
};

const reportUnreadMembers = (
  members: MemberCandidate[],
  reads: Set<string>,
  options: ReportUnusedMembersOptions
): void => {
  for (const candidate of members) {
    const isTemplateRead = reads.has(candidate.name);

    if (isTemplateRead) continue;

    const isProjectUsed = options.projectMemberUsed?.(candidate.node) === true;

    if (isProjectUsed) continue;

    reportMember(options.context, candidate);
  }
};

const reportClassMembers = (
  entry: ClassEntry,
  ngClass: AngularClassMetadata,
  report: ClassReportOptions
): void => {
  const { options, projectAnalysis } = report;
  const isLocalOnlyClass = !ngClass.component || entry.node.abstract === true;
  const candidateOptions: FieldCandidateOptions = {
    allowEffectFields: options.allowEffectFields,
    imports: options.imports,
    localPrivateOnly: !projectAnalysis && isLocalOnlyClass,
    sourceCode: options.context.sourceCode
  };
  const members = memberCandidates(entry.node, candidateOptions);
  const unreadMembers = members.filter(
    (candidate) => !entry.reads.has(candidate.name)
  );

  if (unreadMembers.length === 0) return;

  const remainingNames = unreadMembers.map((candidate) => candidate.name);
  const readsOptions: MetadataReadsOptions = {
    component: ngClass.component && report.localTemplates,
    filename: options.context.filename,
    metadata: ngClass.metadata,
    remainingNames,
    requireTemplate: !projectAnalysis
  };
  const reads = metadataReads(readsOptions);

  if (!reads) return;

  reportUnreadMembers(unreadMembers, reads, options);
};

export const reportUnusedMembers = (
  options: ReportUnusedMembersOptions
): void => {
  const projectAnalysis = options.projectMemberUsed !== undefined;
  const localTemplates = !projectAnalysis || !options.projectIndexed();
  const report: ClassReportOptions = {
    localTemplates,
    options,
    projectAnalysis
  };

  for (const entry of options.classes) {
    const ngClass = angularClassMetadata(entry.node, options.imports);
    const isDynamicClass = options.dynamicClasses.has(entry);

    if (!ngClass || isDynamicClass) continue;

    reportClassMembers(entry, ngClass, report);
  }
};
