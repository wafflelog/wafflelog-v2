import { describe, expect, it } from "vitest";

import { newChecklistItemFormSchema } from "./new-checklist-item/schema";
import { newDocumentFormSchema } from "./new-document/schema";
import { newExpenseFormSchema } from "./new-expense/schema";
import { newPinFormSchema } from "./new-pin/schema";
import { newReferenceLinkFormSchema } from "./new-reference-link/schema";
import { newTripFormSchema } from "./new-trip/schema";

function expectSchemaMessages(
  result: ReturnType<
    | typeof newChecklistItemFormSchema.safeParse
    | typeof newDocumentFormSchema.safeParse
    | typeof newExpenseFormSchema.safeParse
    | typeof newPinFormSchema.safeParse
    | typeof newReferenceLinkFormSchema.safeParse
    | typeof newTripFormSchema.safeParse
  >,
) {
  expect(result.success).toBe(false);

  if (result.success) {
    throw new Error("Expected schema parsing to fail");
  }

  return result.error.issues.map((issue) => issue.message);
}

const validPinInput = {
  pinName: "Dinner",
  pinCategoryId: "food",
  pinStartDate: "2026-07-15",
  pinEndDate: "",
  pinTime: "",
  pinEndTime: "",
  transportDeparture: "",
  transportDestination: "",
};

describe("newChecklistItemFormSchema", () => {
  it("accepts a trimmed checklist item title", () => {
    const result = newChecklistItemFormSchema.safeParse({
      checklistItemTitle: "  Book museum tickets  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      checklistItemTitle: "Book museum tickets",
    });
  });

  it("requires a checklist item title", () => {
    expect(
      expectSchemaMessages(
        newChecklistItemFormSchema.safeParse({
          checklistItemTitle: " ",
        }),
      ),
    ).toContain("Enter an item");
  });
});

describe("newExpenseFormSchema", () => {
  it("accepts a valid expense", () => {
    const result = newExpenseFormSchema.safeParse({
      expenseDescription: "  Coffee  ",
      expenseAmount: "12.50",
      expenseCurrency: "EUR",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      expenseDescription: "Coffee",
      expenseAmount: "12.50",
      expenseCurrency: "EUR",
    });
  });

  it("requires a positive amount with up to two decimal places", () => {
    expect(
      expectSchemaMessages(
        newExpenseFormSchema.safeParse({
          expenseDescription: "Coffee",
          expenseAmount: "12.345",
          expenseCurrency: "EUR",
        }),
      ),
    ).toContain("Enter an amount with up to 2 decimal places");

    expect(
      expectSchemaMessages(
        newExpenseFormSchema.safeParse({
          expenseDescription: "Coffee",
          expenseAmount: "0",
          expenseCurrency: "EUR",
        }),
      ),
    ).toContain("Enter a valid amount");
  });

  it("requires a supported currency", () => {
    expect(
      expectSchemaMessages(
        newExpenseFormSchema.safeParse({
          expenseDescription: "Coffee",
          expenseAmount: "12.50",
          expenseCurrency: "BTC",
        }),
      ),
    ).toContain("Select a currency");
  });
});

describe("newPinFormSchema", () => {
  it("accepts a valid non-range pin", () => {
    const result = newPinFormSchema.safeParse(validPinInput);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validPinInput);
  });

  it("requires a valid category and start date", () => {
    const messages = expectSchemaMessages(
      newPinFormSchema.safeParse({
        ...validPinInput,
        pinCategoryId: "invalid",
        pinStartDate: "",
      }),
    );

    expect(messages).toContain("Select a pin category");
    expect(messages).toContain("Select a date");
  });

  it("requires an end date for range pins", () => {
    expect(
      expectSchemaMessages(
        newPinFormSchema.safeParse({
          ...validPinInput,
          pinCategoryId: "event",
          pinEndDate: "",
        }),
      ),
    ).toContain("Select an end date");
  });

  it("requires range end date to be on or after the start date", () => {
    expect(
      expectSchemaMessages(
        newPinFormSchema.safeParse({
          ...validPinInput,
          pinCategoryId: "event",
          pinEndDate: "2026-07-14",
        }),
      ),
    ).toContain("End date must be on or after the start date");
  });

  it("validates time and end time format", () => {
    const messages = expectSchemaMessages(
      newPinFormSchema.safeParse({
        ...validPinInput,
        pinTime: "24:00",
        pinEndTime: "25:00",
      }),
    );

    expect(messages).toContain("Enter a valid time");
    expect(messages).toContain("Enter a valid end time");
  });

  it("requires range end time to be on or after start time on the same day", () => {
    expect(
      expectSchemaMessages(
        newPinFormSchema.safeParse({
          ...validPinInput,
          pinCategoryId: "event",
          pinEndDate: "2026-07-15",
          pinTime: "18:00",
          pinEndTime: "09:00",
        }),
      ),
    ).toContain("End time must be on or after the start time");
  });

  it("requires transport departure and destination", () => {
    const messages = expectSchemaMessages(
      newPinFormSchema.safeParse({
        ...validPinInput,
        pinCategoryId: "transport",
      }),
    );

    expect(messages).toContain("Enter a departure");
    expect(messages).toContain("Enter a destination");
  });
});

describe("newDocumentFormSchema", () => {
  it("trims optional captions", () => {
    const result = newDocumentFormSchema.safeParse({
      documentCaption: "  Passport scan  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      documentCaption: "Passport scan",
    });
  });

  it("defaults an omitted caption to an empty string", () => {
    const result = newDocumentFormSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      documentCaption: "",
    });
  });
});

describe("newReferenceLinkFormSchema", () => {
  it("accepts a valid URL and optional caption", () => {
    const result = newReferenceLinkFormSchema.safeParse({
      referenceLinkUrl: "https://example.com",
      referenceLinkCaption: "  Booking  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      referenceLinkUrl: "https://example.com",
      referenceLinkCaption: "Booking",
    });
  });

  it("requires a valid URL", () => {
    expect(
      expectSchemaMessages(
        newReferenceLinkFormSchema.safeParse({
          referenceLinkUrl: "not-a-url",
          referenceLinkCaption: "",
        }),
      ),
    ).toContain("Enter a valid URL");
  });
});

describe("newTripFormSchema", () => {
  it("accepts a valid trip", () => {
    const result = newTripFormSchema.safeParse({
      tripName: "  Summer trip  ",
      tripStartDate: "2026-07-15",
      tripEndDate: "2026-07-20",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      tripName: "Summer trip",
      tripStartDate: "2026-07-15",
      tripEndDate: "2026-07-20",
    });
  });

  it("requires the trip end date to be on or after the start date", () => {
    expect(
      expectSchemaMessages(
        newTripFormSchema.safeParse({
          tripName: "Summer trip",
          tripStartDate: "2026-07-20",
          tripEndDate: "2026-07-15",
        }),
      ),
    ).toContain("End date must be on or after the start date");
  });
});

