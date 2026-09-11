const specFilePattern = /\.spec\.[cm]?[tj]sx?$/u;

export const isSpecFile = (fileName: string): boolean => {
  return specFilePattern.test(fileName);
};
