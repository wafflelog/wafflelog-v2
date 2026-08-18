import { AppHeader } from "@/components/header/app-header";
import { HeaderCloseButton } from "@/components/header/icon-button";
import { colors, getColor, semanticColors } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const url = params.url || "";
  const header = (
    <AppHeader
      title={params.title || "Link"}
      trailing={
        <HeaderCloseButton
          accessibilityLabel="Close web viewer"
          onPress={() => router.back()}
        />
      }
    />
  );

  if (!url) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {header}
        <View style={styles.errorContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {header}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(error) => {
          setLoading(false);
          console.error("Error loading web view", error);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={getColor(colors.purple)} />
          </View>
        )}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={getColor(colors.purple)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  webview: {},
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: getColor(colors.white),
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: getColor(colors.white, 0.8),
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
