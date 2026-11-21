import { AppHeader } from "@/components/header/app-header";
import {
  HeaderCloseButton,
  HeaderIconButton,
} from "@/components/header/icon-button";
import { colors, getColor, semanticColors } from "@/constants/theme";
import { useSystemMessage } from "@/hook/use-system-message";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ExternalLink as ExternalLinkIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showMessage, SystemMessageModal } = useSystemMessage();
  const url = params.url || "";
  const handleOpenInBrowser = async () => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening link in the system browser", error);
      showMessage("Unable to open this link in your browser", "error");
    }
  };
  const header = (
    <AppHeader
      sideWidth={url ? 88 : 44}
      title={params.title || "Link"}
      trailing={
        <View style={styles.headerActions}>
          {url ? (
            <HeaderIconButton
              accessibilityLabel="Open in browser"
              icon={ExternalLinkIcon}
              onPress={() => void handleOpenInBrowser()}
            />
          ) : null}
          <HeaderCloseButton
            accessibilityLabel="Close web viewer"
            onPress={() => router.back()}
          />
        </View>
      }
    />
  );

  if (!url) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {header}
        <View style={styles.errorContainer} />
        <SystemMessageModal />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
      <SystemMessageModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticColors.screen,
  },
  webview: {},
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
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
