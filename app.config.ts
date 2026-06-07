import { type ConfigContext, type ExpoConfig } from "expo/config";

import appJson from "./app.json";

type AppVariant = "development" | "preview" | "production";

const baseConfig = appJson.expo as ExpoConfig;

function getAppVariant(): AppVariant {
  if (process.env.APP_VARIANT === "development") {
    return "development";
  }

  if (process.env.APP_VARIANT === "preview") {
    return "preview";
  }

  return "production";
}

function getAppName(variant: AppVariant) {
  if (variant === "development") {
    return "Wafflelog Dev";
  }

  if (variant === "preview") {
    return "Wafflelog Preview";
  }

  return baseConfig.name;
}

function getUniqueIdentifier(variant: AppVariant) {
  const baseIdentifier = "com.wafflelog.wafflelogv2";

  if (variant === "development") {
    return `${baseIdentifier}.dev`;
  }

  if (variant === "preview") {
    return `${baseIdentifier}.preview`;
  }

  return baseIdentifier;
}

function getScheme(variant: AppVariant) {
  if (variant === "development") {
    return "wafflelogv2-dev";
  }

  if (variant === "preview") {
    return "wafflelogv2-preview";
  }

  return baseConfig.scheme;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = getAppVariant();
  const uniqueIdentifier = getUniqueIdentifier(variant);
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  return {
    ...config,
    ...baseConfig,
    name: getAppName(variant),
    scheme: getScheme(variant),
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: uniqueIdentifier,
    },
    android: {
      ...baseConfig.android,
      package: uniqueIdentifier,
    },
    plugins: baseConfig.plugins?.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "react-native-maps"
        ? [
            "react-native-maps",
            {
              iosGoogleMapsApiKey: googleMapsApiKey,
              androidGoogleMapsApiKey: googleMapsApiKey,
            },
          ]
        : plugin,
    ),
  };
};
