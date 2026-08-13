import { TitleRegular } from "@/components/title/regular";
import { UIInputDate } from "@/components/ui/input/date";
import {
  borderRadiuses,
  colors,
  fontSizes,
  gaps,
  getColor,
} from "@/constants/theme";
import { AI_PLANNER_PROMPT_SUGGESTIONS } from "@/data/ai-trip-planner-prototype";
import {
  AI_PLANNER_DESTINATION_MAX_LENGTH,
  AI_PLANNER_TRIP_BRIEF_MAX_LENGTH,
  validatePlanningDestination,
  validatePlanningDuration,
  validatePlanningStartDate,
  validatePlanningTripBrief,
} from "@/lib/ai-trip-planning/intake-validation";
import { getFontFamily } from "@/lib/helper/utils";
import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import dayjs from "dayjs";
import {
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  Sparkles,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IntakeField = keyof AiPlannerIntakeAnswers;

const questions: Record<IntakeField, string> = {
  destination:
    "Where are you thinking of going? A city, region or country is perfect.",
  startDate: "When would you like the trip to start?",
  durationDays: "How many days would you like the trip to last?",
  tripBrief:
    "What would make this a great trip for you? Tell me about your interests, pace, budget, who you’re travelling with, or anything you want to avoid.",
};

const editQuestions: Record<IntakeField, string> = {
  destination: "Let’s update the destination. Where are you thinking?",
  startDate: "Let’s update the start date. When would you like to go?",
  durationDays: "Let’s update the trip length. How many days would you like?",
  tripBrief: "Let’s update your ideas. What would you like me to plan around?",
};

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.messageRow, styles.assistantMessageRow]}>
      <View style={styles.avatar}>
        <Sparkles size={15} color={getColor(colors.purple)} />
      </View>
      <View style={[styles.bubble, styles.assistantBubble]}>
        <TitleRegular
          size="sm"
          color={colors.textDarkGrey}
          style={styles.messageText}
        >
          {children}
        </TitleRegular>
      </View>
    </View>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.messageRow, styles.userMessageRow]}>
      <View style={[styles.bubble, styles.userBubble]}>
        <TitleRegular
          size="sm"
          color={colors.white}
          style={styles.messageText}
        >
          {children}
        </TitleRegular>
      </View>
    </View>
  );
}

type IntakeSummaryProps = {
  answers: AiPlannerIntakeAnswers;
  isSubmitted: boolean;
  onEdit: (field: IntakeField) => void;
  onStartPlanning: () => void;
};

function IntakeSummary({
  answers,
  isSubmitted,
  onEdit,
  onStartPlanning,
}: IntakeSummaryProps) {
  const briefPreview =
    answers.tripBrief.length > 180
      ? `${answers.tripBrief.slice(0, 179)}…`
      : answers.tripBrief;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeading}>
        <CheckCircle2 size={20} color={getColor(colors.pineGreen)} />
        <View style={styles.summaryHeadingCopy}>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            Here&apos;s what I heard
          </TitleRegular>
          <TitleRegular size="xs" color={colors.textLightGrey}>
            Tap any answer if you want to change it.
          </TitleRegular>
        </View>
      </View>

      <TouchableOpacity
        style={styles.summaryRow}
        onPress={() => onEdit("destination")}
        activeOpacity={0.7}
      >
        <View style={styles.summaryIcon}>
          <MapPin size={16} color={getColor(colors.purple)} />
        </View>
        <View style={styles.summaryCopy}>
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Destination
          </TitleRegular>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            {answers.destination}
          </TitleRegular>
        </View>
        <Pencil size={15} color={getColor(colors.textLightGrey)} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.summaryRow}
        onPress={() => onEdit("startDate")}
        activeOpacity={0.7}
      >
        <View style={styles.summaryIcon}>
          <CalendarDays size={16} color={getColor(colors.purple)} />
        </View>
        <View style={styles.summaryCopy}>
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Start date
          </TitleRegular>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            {dayjs(answers.startDate).format("D MMMM YYYY")}
          </TitleRegular>
        </View>
        <Pencil size={15} color={getColor(colors.textLightGrey)} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.summaryRow}
        onPress={() => onEdit("durationDays")}
        activeOpacity={0.7}
      >
        <View style={styles.summaryIcon}>
          <Clock3 size={16} color={getColor(colors.purple)} />
        </View>
        <View style={styles.summaryCopy}>
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Trip length
          </TitleRegular>
          <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
            {answers.durationDays} {answers.durationDays === 1 ? "day" : "days"}
          </TitleRegular>
        </View>
        <Pencil size={15} color={getColor(colors.textLightGrey)} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.summaryRow, styles.summaryRowLast]}
        onPress={() => onEdit("tripBrief")}
        activeOpacity={0.7}
      >
        <View style={styles.summaryIcon}>
          <Sparkles size={16} color={getColor(colors.purple)} />
        </View>
        <View style={styles.summaryCopy}>
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            Your ideas
          </TitleRegular>
          <TitleRegular
            size="xs"
            color={colors.textDarkGrey}
            style={styles.summaryBrief}
          >
            {briefPreview}
          </TitleRegular>
        </View>
        <Pencil size={15} color={getColor(colors.textLightGrey)} />
      </TouchableOpacity>

      {!isSubmitted ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartPlanning}
          activeOpacity={0.8}
        >
          <Sparkles size={17} color={getColor(colors.white)} />
          <TitleRegular size="sm" weight="600" color={colors.white}>
            Start planning
          </TitleRegular>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function AiPlannerIntakeConversation() {
  const scrollRef = useRef<ScrollView>(null);
  const [answers, setAnswers] = useState<Partial<AiPlannerIntakeAnswers>>({});
  const [activeField, setActiveField] =
    useState<IntakeField>("destination");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isComplete =
    answers.destination !== undefined &&
    answers.startDate !== undefined &&
    answers.durationDays !== undefined &&
    answers.tripBrief !== undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [activeField, answers, error, isEditing, isSubmitted]);

  const advanceAfterAnswer = (nextAnswers: Partial<AiPlannerIntakeAnswers>) => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }

    if (nextAnswers.destination === undefined) {
      setActiveField("destination");
    } else if (nextAnswers.startDate === undefined) {
      setActiveField("startDate");
    } else if (nextAnswers.durationDays === undefined) {
      setActiveField("durationDays");
    } else if (nextAnswers.tripBrief === undefined) {
      setActiveField("tripBrief");
    }
  };

  const handleSubmit = () => {
    if (activeField === "destination") {
      const result = validatePlanningDestination(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const nextAnswers = { ...answers, destination: result.value };
      setAnswers(nextAnswers);
      setInput("");
      setError(null);
      advanceAfterAnswer(nextAnswers);
      return;
    }

    if (activeField === "startDate") {
      const result = validatePlanningStartDate(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const nextAnswers = { ...answers, startDate: result.value };
      setAnswers(nextAnswers);
      setInput("");
      setError(null);
      advanceAfterAnswer(nextAnswers);
      return;
    }

    if (activeField === "durationDays") {
      const result = validatePlanningDuration(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const nextAnswers = { ...answers, durationDays: result.value };
      setAnswers(nextAnswers);
      setInput("");
      setError(null);
      advanceAfterAnswer(nextAnswers);
      return;
    }

    const result = validatePlanningTripBrief(input);

    if (!result.success) {
      setError(result.error);
      return;
    }

    const nextAnswers = { ...answers, tripBrief: result.value };
    setAnswers(nextAnswers);
    setInput("");
    setError(null);
    advanceAfterAnswer(nextAnswers);
  };

  const handleEdit = (field: IntakeField) => {
    const answer = answers[field];

    setActiveField(field);
    setInput(answer === undefined ? "" : String(answer));
    setError(null);
    setIsEditing(true);
    setIsSubmitted(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (error) {
      setError(null);
    }
  };

  const inputLimit =
    activeField === "destination"
      ? AI_PLANNER_DESTINATION_MAX_LENGTH
      : activeField === "tripBrief"
        ? AI_PLANNER_TRIP_BRIEF_MAX_LENGTH
        : undefined;
  const placeholder =
    activeField === "destination"
      ? "e.g. Osaka, Japan"
      : activeField === "durationDays"
        ? "e.g. 4"
        : "Share the mood, interests and constraints…";
  const completedAnswers = isComplete
    ? (answers as AiPlannerIntakeAnswers)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Sparkles size={22} color={getColor(colors.purple)} />
          </View>
          <TitleRegular size="lg" color={colors.textDarkGrey}>
            Let&apos;s shape your next trip
          </TitleRegular>
          <TitleRegular
            size="sm"
            color={colors.textLightGrey}
            style={styles.introText}
          >
            I&apos;ll ask four quick questions, one at a time.
          </TitleRegular>
        </View>

        <AssistantBubble>{questions.destination}</AssistantBubble>
        {answers.destination !== undefined ? (
          <UserBubble>{answers.destination}</UserBubble>
        ) : null}

        {answers.destination !== undefined ? (
          <AssistantBubble>{questions.startDate}</AssistantBubble>
        ) : null}
        {answers.startDate !== undefined ? (
          <UserBubble>
            {dayjs(answers.startDate).format("D MMMM YYYY")}
          </UserBubble>
        ) : null}

        {answers.startDate !== undefined ? (
          <AssistantBubble>{questions.durationDays}</AssistantBubble>
        ) : null}
        {answers.durationDays !== undefined ? (
          <UserBubble>
            {answers.durationDays} {answers.durationDays === 1 ? "day" : "days"}
          </UserBubble>
        ) : null}

        {answers.durationDays !== undefined ? (
          <AssistantBubble>{questions.tripBrief}</AssistantBubble>
        ) : null}
        {answers.tripBrief !== undefined ? (
          <UserBubble>{answers.tripBrief}</UserBubble>
        ) : null}

        {isEditing ? (
          <AssistantBubble>{editQuestions[activeField]}</AssistantBubble>
        ) : null}

        {completedAnswers && !isEditing ? (
          <>
            <AssistantBubble>
              Perfect—that gives me enough to start researching your trip.
            </AssistantBubble>
            <IntakeSummary
              answers={completedAnswers}
              isSubmitted={isSubmitted}
              onEdit={handleEdit}
              onStartPlanning={() => setIsSubmitted(true)}
            />
          </>
        ) : null}

        {isSubmitted ? (
          <View style={styles.prototypeResult}>
            <Clock3 size={18} color={getColor(colors.orange)} />
            <View style={styles.prototypeResultCopy}>
              <TitleRegular size="sm" weight="600" color={colors.textDarkGrey}>
                Ready for API integration
              </TitleRegular>
              <TitleRegular size="xs" color={colors.textLightGrey}>
                This prototype stops here. No planning request was sent.
              </TitleRegular>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {!isComplete || isEditing ? (
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
                  onPress={() => handleInputChange(suggestion)}
                >
                  <TitleRegular size="xxs" weight="500" color={colors.purple}>
                    {suggestion}
                  </TitleRegular>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.composerMeta}>
            {error ? (
              <TitleRegular size="xs" color={colors.red} style={styles.error}>
                {error}
              </TitleRegular>
            ) : (
              <TitleRegular size="xxs" color={colors.textLightGrey}>
                UI prototype · answers stay on this device
              </TitleRegular>
            )}
            {inputLimit ? (
              <TitleRegular
                size="xxs"
                color={
                  input.length >= inputLimit ? colors.orange : colors.paleGrey
                }
              >
                {input.length.toLocaleString("en-GB")} /{" "}
                {inputLimit.toLocaleString("en-GB")}
              </TitleRegular>
            ) : null}
          </View>

          {activeField === "startDate" ? (
            <View style={styles.dateComposer}>
              <View style={styles.dateInput}>
                <UIInputDate
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Choose a start date"
                  minimumDate={dayjs().startOf("day").toDate()}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !input && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!input}
                accessibilityLabel="Confirm start date"
              >
                <ArrowUp size={20} color={getColor(colors.white)} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.composer, error && styles.composerError]}>
              <TextInput
                key={activeField}
                value={input}
                onChangeText={handleInputChange}
                onSubmitEditing={
                  activeField === "tripBrief" ? undefined : handleSubmit
                }
                placeholder={placeholder}
                placeholderTextColor={getColor(colors.paleGrey)}
                keyboardType={
                  activeField === "durationDays" ? "number-pad" : "default"
                }
                inputMode={
                  activeField === "durationDays" ? "numeric" : "text"
                }
                multiline={activeField === "tripBrief"}
                maxLength={inputLimit}
                autoFocus
                style={[
                  styles.input,
                  activeField === "tripBrief" && styles.multilineInput,
                  { fontFamily: getFontFamily("400") },
                ]}
                textAlignVertical="top"
                accessibilityLabel={`Planning ${activeField} answer`}
              />
              {activeField === "durationDays" ? (
                <TitleRegular size="xs" color={colors.textLightGrey}>
                  days
                </TitleRegular>
              ) : null}
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSubmit}
                accessibilityLabel="Send answer"
              >
                <ArrowUp size={20} color={getColor(colors.white)} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.prototypeFooter}>
          <View style={styles.prototypeDot} />
          <TitleRegular size="xxs" color={colors.textLightGrey}>
            UI prototype · no API request is sent
          </TitleRegular>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: {
    padding: gaps.md,
    paddingBottom: gaps.xl,
    gap: gaps.md,
  },
  intro: {
    alignItems: "center",
    paddingTop: gaps.sm,
    paddingBottom: gaps.md,
    gap: gaps.xs,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
    marginBottom: gaps.xxs,
  },
  introText: { textAlign: "center", lineHeight: 20 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
  },
  userMessageRow: { justifyContent: "flex-end", paddingLeft: gaps.xl * 2 },
  assistantMessageRow: { justifyContent: "flex-start", paddingRight: gaps.xl },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple, 0.12),
  },
  bubble: {
    maxWidth: 560,
    paddingHorizontal: gaps.sm,
    paddingVertical: gaps.sm,
  },
  userBubble: {
    backgroundColor: getColor(colors.purple),
    borderRadius: borderRadiuses.lg,
    borderBottomRightRadius: borderRadiuses.xs,
  },
  assistantBubble: {
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey, 0.7),
    borderRadius: borderRadiuses.lg,
    borderBottomLeftRadius: borderRadiuses.xs,
  },
  messageText: { lineHeight: 20 },
  summaryCard: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    borderRadius: borderRadiuses.lg,
    padding: gaps.md,
    backgroundColor: getColor(colors.white),
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.16),
    gap: gaps.xs,
  },
  summaryHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    paddingBottom: gaps.xs,
  },
  summaryHeadingCopy: { flex: 1, gap: 2 },
  summaryRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
    paddingVertical: gaps.xs,
    borderBottomWidth: 1,
    borderBottomColor: getColor(colors.whiteGrey, 0.6),
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.purple, 0.08),
  },
  summaryCopy: { flex: 1, gap: 2 },
  summaryBrief: { lineHeight: 18 },
  startButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xs,
    marginTop: gaps.xs,
    borderRadius: borderRadiuses.sm,
    backgroundColor: getColor(colors.purple),
  },
  prototypeResult: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.sm,
    padding: gaps.sm,
    borderRadius: borderRadiuses.md,
    borderWidth: 1,
    borderColor: getColor(colors.orange, 0.2),
    backgroundColor: getColor(colors.orange, 0.07),
  },
  prototypeResultCopy: { flex: 1, gap: 2 },
  composerArea: {
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
    backgroundColor: getColor(colors.white),
    paddingHorizontal: gaps.md,
    paddingTop: gaps.xs,
    paddingBottom: gaps.sm,
    gap: gaps.xs,
  },
  suggestions: { gap: gaps.xs, paddingRight: gaps.md },
  suggestion: {
    borderWidth: 1,
    borderColor: getColor(colors.purple, 0.25),
    backgroundColor: getColor(colors.purple, 0.06),
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
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: gaps.xs,
    borderWidth: 1,
    borderColor: getColor(colors.whiteGrey),
    borderRadius: borderRadiuses.lg,
    paddingLeft: gaps.sm,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: getColor(colors.white),
  },
  dateComposer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: gaps.xs,
  },
  dateInput: { flex: 1 },
  composerError: { borderColor: getColor(colors.red, 0.7) },
  input: {
    flex: 1,
    minHeight: 38,
    paddingTop: 8,
    paddingBottom: 7,
    fontSize: fontSizes.sm,
    color: getColor(colors.textDarkGrey),
  },
  multilineInput: { maxHeight: 120 },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadiuses.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: getColor(colors.purple),
  },
  sendButtonDisabled: { backgroundColor: getColor(colors.paleGrey) },
  prototypeFooter: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: gaps.xxs,
    borderTopWidth: 1,
    borderTopColor: getColor(colors.whiteGrey, 0.7),
    backgroundColor: getColor(colors.white),
  },
  prototypeDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadiuses.full,
    backgroundColor: getColor(colors.orange),
  },
});
