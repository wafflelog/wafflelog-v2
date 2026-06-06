import { CATEGORIES } from "@/constants/pin-categories";
import { isRangePinCategory } from "@/lib/pin";
import { iso, z } from "zod";

const categoryIds: string[] = CATEGORIES.map((category) => category.id);
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Enter a valid time");

export const newPinFormSchema = z
  .object({
    pinName: z.string().trim().max(200, "Pin name is too long"),
    pinCategoryId: z.string().refine((value) => categoryIds.includes(value), {
      message: "Select a pin category",
    }),
    pinStartDate: z.string().min(1, "Select a date").pipe(iso.date()),
    pinEndDate: z.string(),
    pinTime: z.string(),
    pinEndTime: z.string(),
    transportDeparture: z.string(),
    transportDestination: z.string(),
  })
  .superRefine((value, context) => {
    const isRangePin = isRangePinCategory(value.pinCategoryId);

    if (isRangePin) {
      const endDate = z.string().min(1).pipe(iso.date()).safeParse(value.pinEndDate);

      if (!endDate.success) {
        context.addIssue({
          code: "custom",
          path: ["pinEndDate"],
          message: "Select an end date",
        });
      } else if (value.pinEndDate < value.pinStartDate) {
        context.addIssue({
          code: "custom",
          path: ["pinEndDate"],
          message: "End date must be on or after the start date",
        });
      }
    }

    if (value.pinTime.trim() && !timeSchema.safeParse(value.pinTime).success) {
      context.addIssue({
        code: "custom",
        path: ["pinTime"],
        message: "Enter a valid time",
      });
    }

    if (
      value.pinEndTime.trim() &&
      !timeSchema.safeParse(value.pinEndTime).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["pinEndTime"],
        message: "Enter a valid end time",
      });
    }

    if (
      isRangePin &&
      value.pinStartDate === value.pinEndDate &&
      value.pinTime.trim() &&
      value.pinEndTime.trim() &&
      timeSchema.safeParse(value.pinTime).success &&
      timeSchema.safeParse(value.pinEndTime).success &&
      value.pinEndTime < value.pinTime
    ) {
      context.addIssue({
        code: "custom",
        path: ["pinEndTime"],
        message: "End time must be on or after the start time",
      });
    }

    if (value.pinCategoryId === "transport") {
      if (!value.transportDeparture.trim()) {
        context.addIssue({
          code: "custom",
          path: ["transportDeparture"],
          message: "Enter a departure",
        });
      }

      if (!value.transportDestination.trim()) {
        context.addIssue({
          code: "custom",
          path: ["transportDestination"],
          message: "Enter a destination",
        });
      }
    }
  });

export type NewPinFormValues = z.infer<typeof newPinFormSchema>;
