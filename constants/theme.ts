export const colors = {
  waffle: [255, 179, 0],
  waffleCream: [255, 249, 232],
  orange: [255, 128, 0],
  turquoise: [42, 183, 202],
  blue: [50, 100, 150],
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

export const lineHeights = {
  xxs: 14,
  xs: 17,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 28,
  xxl: 32,
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

// Semantic roles keep the brand hierarchy consistent across the app. Raw
// palette colours remain available for contextual accents and categories.
export const semanticColors = {
  screen: getColor(colors.white),
  authScreen: getColor(colors.waffleCream),
  surface: getColor(colors.white),
  textPrimary: getColor(colors.textDarkGrey),
  textSecondary: getColor(colors.textLightGrey),
  primaryAction: getColor(colors.waffle),
  primaryActionContent: getColor(colors.textDarkGrey),
  brandDivider: getColor(colors.waffle, 0.22),
  neutralDivider: getColor(colors.whiteGrey),
} as const;

export const getShadowStyle = (size: "sm" | "md" | "lg" | "xl") => {
  const shadows = {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
  } as const satisfies Record<
    "sm" | "md" | "lg" | "xl",
    {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
    }
  >;
  const elevations = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  };

  return {
    shadowColor: shadows[size].shadowColor,
    shadowOffset: shadows[size].shadowOffset,
    shadowOpacity: shadows[size].shadowOpacity,
    shadowRadius: shadows[size].shadowRadius,
    elevation: elevations[size],
  };
};

export const getCardBasicStyle = (size: "sm" | "md" | "lg") => {
  return {
    ...getShadowStyle(size),
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.65),
    borderRadius: borderRadiuses[size],
    padding: gaps[size],
  };
};
