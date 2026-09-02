export const isSpecFile = (fileName: string): boolean =>
  /\.spec\.[cm]?[tj]sx?$/u.test(fileName);
