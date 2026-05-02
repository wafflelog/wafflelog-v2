import { CURRENCIES } from "@/types/pin";
import { z } from "zod";

export const newExpenseFormSchema = z.object({
  expenseDescription: z
    .string()
    .trim()
    .min(1, "Enter a description")
    .max(200, "Description is too long"),
  expenseAmount: z
    .string()
    .trim()
    .min(1, "Enter an amount")
    .refine((value) => {
      const amount = Number(value);
      return Number.isFinite(amount) && amount > 0;
    }, "Enter a valid amount"),
  expenseCurrency: z.string().refine((value) => CURRENCIES.includes(value as never), {
    message: "Select a currency",
  }),
});

export type NewExpenseFormValues = z.infer<typeof newExpenseFormSchema>;
