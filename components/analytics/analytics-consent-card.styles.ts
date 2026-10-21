import {
  borderRadiuses,
  colors,
  gaps,
  getColor,
  semanticColors,
} from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: gaps.md,
    marginTop: gaps.md,
    padding: gaps.md,
    borderWidth: 1,
    borderColor: getColor(colors.waffle, 0.45),
    borderRadius: borderRadiuses.md,
    backgroundColor: getColor(colors.waffle, 0.09),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.waffle, 0.2),
  },
  title: {
    flex: 1,
    color: semanticColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    marginTop: gaps.xs,
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  privacyLink: {
    alignSelf: "flex-start",
    minHeight: 32,
    justifyContent: "center",
  },
  privacyLinkText: {
    color: getColor(colors.purple),
    fontSize: 12,
    lineHeight: 17,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: gaps.xs,
    marginTop: gaps.xs,
  },
  button: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gaps.md,
    borderRadius: borderRadiuses.full,
  },
  dismissButton: {
    borderWidth: 1,
    borderColor: semanticColors.neutralDivider,
    backgroundColor: semanticColors.surface,
  },
  allowButton: {
    backgroundColor: semanticColors.primaryAction,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dismissButtonText: {
    color: semanticColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  allowButtonText: {
    color: semanticColors.primaryActionContent,
    fontSize: 12,
    lineHeight: 17,
  },
});
