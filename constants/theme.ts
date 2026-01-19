export const colors = {
  waffle: [255, 179, 0],
  orange: [255, 128, 0],
  turquoise: [42, 183, 202],
  purple: [82, 72, 156],
  red: [254, 74, 73],
  pineGreen: [50, 98, 115],
  paleGrey: [220, 220, 220],
  textLightGrey: [100, 100, 100],
  textDarkGrey: [50, 50, 50],
} as const satisfies Record<string, [number, number, number]>;

export const getColor = (color: [number, number, number], alpha?: number) => {
  if (alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};
