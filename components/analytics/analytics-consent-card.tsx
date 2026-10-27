import { UIText } from "@/components/ui/text";
import { externalLinks } from "@/constants/external-links";
import { colors, getColor } from "@/constants/theme";
import { useAnalyticsConsent } from "@/hook/use-analytics-consent";
import { ChartNoAxesColumnIncreasing as AnalyticsIcon } from "lucide-react-native";
import { Linking, Pressable, View } from "react-native";

import { styles } from "./analytics-consent-card.styles";

export function AnalyticsConsentCard() {
  const { hasChoice, isUpdating, setEnabled, status } = useAnalyticsConsent();

  if (status === "loading" || hasChoice) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <AnalyticsIcon size={19} color={getColor(colors.purple)} />
        </View>
        <UIText style={styles.title} weight="700">
          Help improve Wafflelog
        </UIText>
      </View>

      <UIText style={styles.description}>
        Share usage data about the screens and features you use. It helps us
        understand what is useful and improve Wafflelog. We do not use it for
        advertising.
      </UIText>

      <Pressable
        accessibilityRole="link"
        onPress={() => void Linking.openURL(externalLinks.privacy)}
        style={styles.privacyLink}
      >
        <UIText style={styles.privacyLinkText} weight="600">
          Learn more
        </UIText>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Do not share usage analytics"
          accessibilityRole="button"
          disabled={isUpdating}
          onPress={() => void setEnabled(false)}
          style={({ pressed }) => [
            styles.button,
            styles.dismissButton,
            pressed && styles.buttonPressed,
            isUpdating && styles.buttonDisabled,
          ]}
        >
          <UIText style={styles.dismissButtonText} weight="600">
            Not now
          </UIText>
        </Pressable>

        <Pressable
          accessibilityLabel="Share usage analytics"
          accessibilityRole="button"
          disabled={isUpdating}
          onPress={() => void setEnabled(true)}
          style={({ pressed }) => [
            styles.button,
            styles.allowButton,
            pressed && styles.buttonPressed,
            isUpdating && styles.buttonDisabled,
          ]}
        >
          <UIText style={styles.allowButtonText} weight="700">
            Help improve
          </UIText>
        </Pressable>
      </View>
    </View>
  );
}
