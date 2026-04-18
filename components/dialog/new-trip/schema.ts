import { iso, z } from "zod";

export const newTripFormSchema = z
  .object({
    tripName: z
      .string()
      .trim()
      .min(1, "Enter a trip name")
      .max(200, "Trip name is too long"),
    tripStartDate: z
      .string()
      .min(1, "Select a trip start date")
      .pipe(iso.datetime()),
    tripEndDate: z
      .string()
      .min(1, "Select a trip end date")
      .pipe(iso.datetime()),
  })
  .refine(
    (data) => new Date(data.tripEndDate) >= new Date(data.tripStartDate),
    {
      message: "End date must be on or after the start date",
      path: ["tripEndDate"],
    },
  );

export type NewTripFormValues = z.infer<typeof newTripFormSchema>;
