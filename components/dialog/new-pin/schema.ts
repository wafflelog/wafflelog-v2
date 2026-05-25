import { CATEGORIES } from "@/constants/pin-categories";
import { iso, z } from "zod";

const categoryIds: string[] = CATEGORIES.map((category) => category.id);
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Enter a valid time");

export const newPinFormSchema = z
  .object({
    pinName: z
      .string()
      .trim()
      .min(1, "Enter a pin name")
      .max(200, "Pin name is too long"),
    pinCategoryId: z.string().refine((value) => categoryIds.includes(value), {
      message: "Select a pin category",
    }),
    pinStartDate: z.string().min(1, "Select a start date").pipe(iso.date()),
    pinStartTime: z.string(),
    pinEndDate: z.string().min(1, "Select an end date").pipe(iso.date()),
    pinEndTime: z.string(),
    pinAllDay: z.boolean(),
    transportDeparture: z.string(),
    transportDestination: z.string(),
    transportCarrier: z.string(),
    transportReference: z.string(),
  })
  .superRefine((value, context) => {
    if (value.pinEndDate < value.pinStartDate) {
      context.addIssue({
        code: "custom",
        path: ["pinEndDate"],
        message: "End date must be on or after the start date",
      });
    }

    if (!value.pinAllDay) {
      const hasStartTime = value.pinStartTime.trim().length > 0;
      const hasEndTime = value.pinEndTime.trim().length > 0;
      const startTime = timeSchema.safeParse(value.pinStartTime);
      const endTime = timeSchema.safeParse(value.pinEndTime);

      if (hasStartTime && !startTime.success) {
        context.addIssue({
          code: "custom",
          path: ["pinStartTime"],
          message: "Enter a valid start time",
        });
      }

      if (hasEndTime && !endTime.success) {
        context.addIssue({
          code: "custom",
          path: ["pinEndTime"],
          message: "Enter a valid end time",
        });
      }

      if (
        hasStartTime &&
        hasEndTime &&
        startTime.success &&
        endTime.success &&
        value.pinStartDate === value.pinEndDate &&
        value.pinEndTime < value.pinStartTime
      ) {
        context.addIssue({
          code: "custom",
          path: ["pinEndTime"],
          message: "End time must be after the start time",
        });
      }
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
