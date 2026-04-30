import { z } from "zod";

export const MAX_TRAVEL_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const newDocumentFormSchema = z.object({
  documentCaption: z
    .string()
    .trim()
    .max(200, "Caption is too long")
    .optional()
    .transform((value) => value?.trim() ?? ""),
});

export type NewDocumentFormValues = z.infer<typeof newDocumentFormSchema>;
