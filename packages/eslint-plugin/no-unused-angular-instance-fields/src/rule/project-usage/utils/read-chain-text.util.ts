import type { ReadSegment } from '../common/project-usage.type.ts';

const segmentText = (segment: ReadSegment): string => {
  const call = segment.called ? '()' : '';

  return `${segment.name}${call}`;
};

/** A read chain rendered the way it appeared in the template. */
export const chainText = (names: ReadSegment[]): string => {
  const texts = names.map(segmentText);

  return texts.join('.');
};
