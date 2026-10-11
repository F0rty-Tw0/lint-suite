import type { ESLint } from 'eslint';

export const reportedRuleIds = async (
  eslint: ESLint,
  code: string,
  filePath: string
): Promise<(string | null)[]> => {
  const [result] = await eslint.lintText(code, { filePath });
  const messages = result?.messages ?? [];

  return messages.map((message) => message.ruleId);
};
