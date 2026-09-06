import assert from 'node:assert/strict';

import type { Linter } from 'eslint';

const memberKey = (message: Linter.LintMessage): string => {
  assert.ok(
    message.messageId,
    `unexpected non-rule message: ${message.message}`
  );

  return `${message.messageId}:${/'([^']+)'/u.exec(message.message)?.[1]}`;
};

export const reportedMembers = (messages: Linter.LintMessage[]): string[] => {
  const members = messages.map(memberKey);

  return members.sort();
};
