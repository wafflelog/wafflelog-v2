import { AiPlannerSendButton } from "@/components/ai-trip-planner/chat/send-button";
import { AiPlannerTextComposer } from "@/components/ai-trip-planner/chat/text-composer";
import { TitleRegular } from "@/components/title/regular";
import { UIInputDate } from "@/components/ui/input/date";
import { borderRadiuses, colors, gaps, getColor } from "@/constants/theme";
import { AI_PLANNER_PROMPT_SUGGESTIONS } from "@/data/ai-trip-planner-prototype";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import dayjs from "dayjs";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  AI_PLANNER_INTAKE_INPUT_ID,
  INTAKE_INPUT_CONFIG,
  type IntakeField,
} from "./intake-config";

type AiPlannerIntakeComposerProps = {
  activeField: IntakeField;
  answers: Partial<AiPlannerIntakeAnswers>;
  input: string;
  error: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

export function AiPlannerIntakeComposer({
  activeField,
  answers,
  input,
  error,
  onInputChange,
  onSubmit,
}: AiPlannerIntakeComposerProps) {
  const inputConfig = INTAKE_INPUT_CONFIG[activeField];
  const inputLimit = inputConfig.getMaxLength(answers);
  let inputControl: React.ReactNode;

  switch (activeField) {
    case "startDate":
      inputControl = (
        <View style={styles.dateComposer}>
          <View style={styles.dateInput}>
            <UIInputDate
              value={input}
              onChange={onInputChange}
              placeholder={inputConfig.placeholder}
              minimumDate={dayjs().startOf("day").toDate()}
            />
          </View>
          <AiPlannerSendButton
            disabled={!input}
            onPress={onSubmit}
            accessibilityLabel="Confirm start date"
          />
        </View>
      );
      break;
    default:
      inputControl = (
        <AiPlannerTextComposer
          value={input}
          placeholder={inputConfig.placeholder}
          accessibilityLabel={`Planning ${activeField} answer`}
          nativeID={AI_PLANNER_INTAKE_INPUT_ID}
          onChange={onInputChange}
          onSubmit={onSubmit}
          error={Boolean(error)}
          multiline={inputConfig.multiline}
          maxLength={inputLimit}
          keyboardType={inputConfig.keyboardType}
          inputMode={inputConfig.inputMode}
          suffix={inputConfig.suffix}
        />
      );
  }

  return (
    <View style={styles.composerArea}>
      {activeField === "tripBrief" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestions}
        >
          {AI_PLANNER_PROMPT_SUGGESTIONS.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.suggestion}
              onPress={() => onInputChange(suggestion)}
            >
              <TitleRegular size="xxs" weight="500" color={colors.purple}>
                {suggestion}
              </TitleRegular>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composerMeta}>
        <TitleRegular
          size={error ? "xs" : "xxs"}
          color={error ? colors.red : colors.textLightGrey}
          style={styles.error}
        >
          {error ?? ""}
        </TitleRegular>
        {inputLimit ? (
          <TitleRegular
            size="xxs"
            color={input.length >= inputLimit ? colors.orange : colors.paleGrey}
          >
            {input.length.toLocaleString("en-GB")} /{" "}
            {inputLimit.toLocaleString("en-GB")}
          </TitleRegular>
        ) : null}
      </View>

      {inputControl}
    </View>
  );
}

const styles = StyleSheet.create({
  composerArea: {
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey),
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
  },
  suggestions: { gap: gaps.xs, paddingRight: gaps.md },
  suggestion: {
    borderWidth: 1,
    borderColor: getColor(colors.purple),
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.sm,
    paddingVertical: 6,
    borderRadius: borderRadiuses.full,
  },
  composerMeta: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: gaps.xs,
  },
  error: { flex: 1 },
  dateComposer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  dateInput: { flex: 1 },
});
