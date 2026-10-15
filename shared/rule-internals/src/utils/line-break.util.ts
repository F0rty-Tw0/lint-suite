export const lineBreakOf = (text: string): string => {
  const firstBreak = text.indexOf('\n');
  const isCrlf = text[firstBreak - 1] === '\r';

  if (isCrlf) return '\r\n';

  return '\n';
};
