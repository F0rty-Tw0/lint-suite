import assert from 'node:assert/strict';

import type { Linter } from 'eslint';

export const reportedMembers = (messages: Linter.LintMessage[]): string[] =>
  messages
    .map((message) => {
      assert.ok(
        message.messageId,
        `unexpected non-rule message: ${message.message}`
      );

      return `${message.messageId}:${/'([^']+)'/u.exec(message.message)?.[1]}`;
    })
    .sort();
