import { TitleRegular } from "@/components/title/regular";
import { colors, getColor } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X as XIcon } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{ url?: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const url = params.url || "";

  if (!url) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.errorContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TitleRegular size="md" weight="600" style={styles.headerTitle}>
            {params.title}
          </TitleRegular>
          <TouchableOpacity onPress={() => router.back()}>
            <XIcon size={24} color={getColor(colors.pineGreen)} />
          </TouchableOpacity>
        </View>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
