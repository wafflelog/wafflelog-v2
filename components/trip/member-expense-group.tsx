import { TitleRegular } from "@/components/title/regular";
import {
  borderRadiuses,
  colors,
  gaps,
  getCardBasicStyle,
  getColor,
} from "@/constants/theme";
import { type PersonalExpenseMemberBalance } from "@/lib/helper/expense";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type MemberExpenseGroupProps = {
  member: PersonalExpenseMemberBalance;
  displayName: string;
  currency: string;
};

const directionLabels = {
  you_owe: "You owe",
  owed_to_you: "Owes you",
  settled: "Settled",
} as const;

const directionColors = {
  you_owe: colors.red,
  owed_to_you: colors.pineGreen,
  settled: colors.textLightGrey,
} as const;

export function MemberExpenseGroup({
  member,
  displayName,
  currency,
}: MemberExpenseGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusLabel = directionLabels[member.direction];
  const statusColor = directionColors[member.direction];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded((current) => !current)}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <TitleRegular size="sm" weight="700" color={colors.purple}>
              {displayName.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
            </TitleRegular>
          </View>
          <View style={styles.memberText}>
            <TitleRegular size="sm" weight="600" numberOfLines={1}>
              {displayName}
            </TitleRegular>
            <TitleRegular size="xs" color={statusColor}>
              {statusLabel}
            </TitleRegular>
          </View>
        </View>

        <View style={styles.amountArea}>
          <TitleRegular size="sm" weight="700" color={statusColor}>
            {member.amount} {currency}
          </TitleRegular>
          {isExpanded ? (
            <ChevronUp size={18} color={getColor(colors.textLightGrey)} />
          ) : (
            <ChevronDown size={18} color={getColor(colors.textLightGrey)} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.breakdown}>
          {member.items.map((item) => {
            const isOwedToYou = item.direction === "owed_to_you";

            return (
              <View key={`${item.id}-${item.direction}`} style={styles.item}>
                <View style={styles.itemText}>
                  <TitleRegular size="xs" weight="600" numberOfLines={2}>
                    {item.description}
                  </TitleRegular>
                  <TitleRegular size="xxs" color={colors.textLightGrey}>
                    {item.context ??
                      (isOwedToYou ? "Paid by you" : `Paid by ${displayName}`)}
                  </TitleRegular>
                </View>
                <TitleRegular
                  size="xs"
                  weight="600"
                  color={isOwedToYou ? colors.pineGreen : colors.red}
                >
                  {isOwedToYou ? "+" : "−"}
                  {item.amount} {currency}
                </TitleRegular>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("sm"),
    padding: 0,
    overflow: "hidden",
  },
  header: {
    minHeight: 68,
    padding: gaps.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.1),
  },
  memberText: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  amountArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: gaps.xs,
  },
  breakdown: {
    padding: gaps.sm,
    paddingTop: 0,
    marginHorizontal: gaps.sm,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.sm,
    paddingVertical: gaps.sm,
  },
  itemText: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
});
