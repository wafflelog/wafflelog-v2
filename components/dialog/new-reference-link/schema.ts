import { z } from "zod";

export const newReferenceLinkFormSchema = z.object({
  referenceLinkUrl: z
    .string()
    .trim()
    .min(1, "Enter a URL")
    .url("Enter a valid URL"),
  referenceLinkCaption: z
    .string()
    .trim()
    .max(200, "Caption is too long")
    .optional()
    .or(z.literal("")),
});

export type NewReferenceLinkFormValues = z.infer<
  typeof newReferenceLinkFormSchema
>;
