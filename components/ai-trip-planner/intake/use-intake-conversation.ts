import { type AiPlannerIntakeAnswers } from "@/types/ai-trip-planner";
import { useState } from "react";
import {
  INTAKE_FIELD_ORDER,
  validateIntakeField,
  type IntakeField,
} from "./intake-config";

type UseIntakeConversationOptions = {
  canEdit: boolean;
  onEditAnswers: () => void;
};

export function useIntakeConversation({
  canEdit,
  onEditAnswers,
}: UseIntakeConversationOptions) {
  const [answers, setAnswers] = useState<Partial<AiPlannerIntakeAnswers>>({});
  const [activeField, setActiveField] = useState<IntakeField>("destination");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const isComplete = INTAKE_FIELD_ORDER.every(
    (field) => answers[field] !== undefined,
  );
  const completedAnswers = isComplete
    ? (answers as AiPlannerIntakeAnswers)
    : null;

  const handleInputChange = (value: string) => {
    setInput(value);
    setError(null);
  };

  const handleSubmit = () => {
    const result = validateIntakeField(activeField, input, answers);

    if (!result.success) {
      setError(result.error);
      return;
    }

    const nextAnswers = {
      ...answers,
      [activeField]: result.value,
    } as Partial<AiPlannerIntakeAnswers>;

    setAnswers(nextAnswers);
    setInput("");
    setError(null);

    if (isEditing) {
      setIsEditing(false);
      return;
    }

    const nextField = INTAKE_FIELD_ORDER.find(
      (field) => nextAnswers[field] === undefined,
    );

    if (nextField) {
      setActiveField(nextField);
    }
  };

  const handleEdit = (field: IntakeField) => {
    if (!canEdit || !completedAnswers) {
      return;
    }

    setActiveField(field);
    setInput(String(completedAnswers[field]));
    setError(null);
    setIsEditing(true);
    onEditAnswers();
  };

  return {
    activeField,
    answers,
    completedAnswers,
    error,
    input,
    isComplete,
    isEditing,
    answeredCount: INTAKE_FIELD_ORDER.filter(
      (field) => answers[field] !== undefined,
    ).length,
    handleEdit,
    handleInputChange,
    handleSubmit,
  };
}
