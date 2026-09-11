const helpers = {
  compute: (value: number): boolean => {
    return value > 0;
  }
};

export const describeValue = (value: number): string => {
  if (helpers.compute(value)) return 'yes';

  return 'no';
};
