import { UIText } from "@/components/ui/text";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { Users as UsersGroupIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

export type TripSharing = "single-user" | "shared-owner" | "shared-participant";

export const TRIP_SHARING_ACCESSIBILITY_LABELS: Record<TripSharing, string> = {
  "single-user": "",
  "shared-owner": "Shared trip, owned by you.",
  "shared-participant": "Shared trip.",
};

type SharedTripIndicatorProps = {
  sharing: Exclude<TripSharing, "single-user">;
};

export function SharedTripIndicator({ sharing }: SharedTripIndicatorProps) {
  const isOwner = sharing === "shared-owner";

  return (
    <View style={styles.container}>
      <UsersGroupIcon size={14} color={getColor(colors.pineGreen)} />
      <UIText style={styles.label} weight="600">
        {isOwner ? "Owner" : "Companion"}
      </UIText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: gaps.xxs,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.turquoise, 0.15),
  },
  label: {
    color: getColor(colors.pineGreen),
    fontSize: 11,
    lineHeight: 15,
  },
});
