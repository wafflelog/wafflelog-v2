export const colors = {
  waffle: [255, 179, 0],
  orange: [255, 128, 0],
  turquoise: [42, 183, 202],
  purple: [82, 72, 156],
  red: [254, 74, 73],
  pineGreen: [50, 98, 115],
  whiteGrey: [220, 220, 220],
  paleGrey: [180, 180, 180],
  textLightGrey: [100, 100, 100],
  textDarkGrey: [50, 50, 50],
  white: [255, 255, 255],
  black: [0, 0, 0],
} as const satisfies Record<string, [number, number, number]>;

export const borderRadiuses = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const fontSizes = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const gaps = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
};

export const getColor = (color: [number, number, number], alpha?: number) => {
  if (alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};

export const getCardBasicStyle = (size: "sm" | "md" | "lg") => {
  const shadows = {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
  } as const satisfies Record<
    "sm" | "md" | "lg",
    {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    }
  >;
  const elevations = {
    sm: 3,
    md: 4,
    lg: 5,
  };

  return {
    backgroundColor: "#fff",
    borderRadius: borderRadiuses[size],
    padding: gaps[size],
    shadowColor: shadows[size].shadowColor,
    shadowOffset: shadows[size].shadowOffset,
    shadowOpacity: shadows[size].shadowOpacity,
    shadowRadius: shadows[size].shadowRadius,
    elevation: elevations[size],
  };
};
