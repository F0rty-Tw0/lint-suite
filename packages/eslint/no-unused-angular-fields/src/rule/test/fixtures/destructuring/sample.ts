export type Point = {
  readonly x: number;
  readonly y: number;
  readonly label: string;
};

export type Pair = [Point, Point];

export const point: Point = { x: 1, y: 2, label: 'origin' };
export const pair: Pair = [point, point];

export const { x, label: name, ...restOfPoint } = point;
export const [first, , ...restOfPair] = pair;
export const {
  x: { y: nestedY }
} = { x: point };

export let assignedX = 0;
export let assignedLabel = '';
export let assignedFirst: Point = point;

({ x: assignedX, label: assignedLabel } = point);
[assignedFirst] = pair;
