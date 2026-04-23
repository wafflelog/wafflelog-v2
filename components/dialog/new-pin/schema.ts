import { CATEGORIES } from "@/data/pins";
import { iso, z } from "zod";

const categoryIds = CATEGORIES.map((category) => category.id);

export const newPinFormSchema = z.object({
  pinName: z.string().trim().min(1, "Enter a pin name").max(200, "Pin name is too long"),
  pinDate: z.string().min(1, "Select a date").pipe(iso.date()),
  pinTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Enter a valid time"),
  pinCategoryId: z.string().refine((value) => categoryIds.includes(value), {
    message: "Select a pin category",
  }),
});

export type NewPinFormValues = z.infer<typeof newPinFormSchema>;
