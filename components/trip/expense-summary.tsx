import { TitleRegular } from "@/components/title/regular";
import { colors, gaps, getCardBasicStyle, getColor } from "@/constants/theme";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";

export function TripExpenseSummary() {
  const columns = [
    {
      label: "Total",
      amount: "192.00",
      color: colors.textDarkGrey,
    },
    {
      label: "You paid",
      amount: "100.00",
      color: colors.turquoise,
    },
    {
      label: "You are owed",
      amount: "92.00",
      color: colors.red,
    },
  ];

  const renderColumn = (
    label: string,
    amount: string,
    color: [number, number, number],
  ) => {
    return (
      <View style={styles.column}>
        <TitleRegular size="xs" weight="500">
          {label}
        </TitleRegular>
        <TitleRegular size="md" weight="600" color={color}>
          {amount}
        </TitleRegular>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TitleRegular
        size="md"
        weight="600"
        style={styles.header}
        color={colors.pineGreen}
      >
        EUR
      </TitleRegular>

      <View style={styles.content}>
        {columns.map((column, index) => {
          return (
            <Fragment key={column.label}>
              {renderColumn(column.label, column.amount, column.color)}

              {index < columns.length - 1 && <View style={styles.divider} />}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...getCardBasicStyle("md"),
    backgroundColor: getColor(colors.pineGreen, 0.15),
    gap: gaps.sm,
    borderWidth: 0,
    borderColor: getColor(colors.pineGreen, 0.3),
  },
  header: {},
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
    padding: gaps.xs,
  },
  left: {
    flex: 1,
  },
  center: {
    flex: 1,
  },
  right: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: getColor(colors.paleGrey),
  },
});
