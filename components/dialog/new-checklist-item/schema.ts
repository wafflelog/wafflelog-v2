import { z } from "zod";

export const newChecklistItemFormSchema = z.object({
  checklistItemTitle: z
    .string()
    .trim()
    .min(1, "Enter an item")
    .max(200, "Checklist item is too long"),
});

export type NewChecklistItemFormValues = z.infer<
  typeof newChecklistItemFormSchema
>;
