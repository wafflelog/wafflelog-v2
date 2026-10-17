import { Decimal } from "decimal.js";
import { getUserDisplayName } from "./user-display";

export type ExpensePayerDisplayInput = {
  paidByUserId: string;
  paidByName: string;
  paidByUsername: string | null;
  currentUserId: string;
};

export function getExpensePayerDisplayName({
  paidByUserId,
  paidByName,
  paidByUsername,
  currentUserId,
}: ExpensePayerDisplayInput) {
  const fallback = paidByName === "You" ? "Unknown payer" : paidByName;

  return getUserDisplayName(
    { userId: paidByUserId, username: paidByUsername },
    currentUserId,
    fallback,
  );
}

export type SharedExpenseParticipant = {
  userId: string;
  splitAmount: string;
};

export type SharedExpenseInput = {
  id: string;
  currency: string;
  amount: string;
  paidByUserId: string;
  participants: SharedExpenseParticipant[];
};

export type SharedExpenseBalance = {
  userId: string;
  paid: string;
  owed: string;
  net: string;
};

export type SharedExpenseSettlement = {
  fromUserId: string;
  toUserId: string;
  amount: string;
};

export type SharedExpenseCurrencyLedger = {
  currency: string;
  balances: SharedExpenseBalance[];
  settlements: SharedExpenseSettlement[];
};

export type PersonalExpenseInput = SharedExpenseInput & {
  description: string;
  context?: string;
};

export type PersonalExpenseBreakdownItem = {
  id: string;
  description: string;
  context?: string;
  direction: "you_owe" | "owed_to_you";
  amount: string;
};

export type PersonalExpenseMemberBalance = {
  userId: string;
  direction: "you_owe" | "owed_to_you" | "settled";
  amount: string;
  items: PersonalExpenseBreakdownItem[];
};

export type PersonalExpenseCurrencyLedger = {
  currency: string;
  totalSpent: string;
  youOwe: string;
  owedToYou: string;
  members: PersonalExpenseMemberBalance[];
};

const MONEY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/;
const CENT = new Decimal("0.01");

function parseAmount(amount: string, fieldName: string) {
  const normalizedAmount = amount.trim();

  if (!MONEY_PATTERN.test(normalizedAmount)) {
    throw new Error(
      `${fieldName} must be a non-negative amount with up to two decimal places`,
    );
  }

  return new Decimal(normalizedAmount);
}

function formatAmount(amount: Decimal) {
  return amount.toFixed(2);
}

function validateUserId(userId: string, fieldName: string) {
  if (!userId.trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Splits an amount evenly and allocates any remaining cent deterministically
 * by ascending user ID. Returned values are safe to persist as split_amount.
 */
export function splitExpenseEqually(
  amount: string,
  participantUserIds: string[],
): SharedExpenseParticipant[] {
  const total = parseAmount(amount, "Amount");

  if (!total.greaterThan(0)) {
    throw new Error("Amount must be greater than zero");
  }

  if (participantUserIds.length === 0) {
    throw new Error("At least one participant is required");
  }

  const sortedParticipantUserIds = [...participantUserIds].sort((left, right) =>
    left.localeCompare(right),
  );

  for (const userId of sortedParticipantUserIds) {
    validateUserId(userId, "Participant user ID");
  }

  if (
    new Set(sortedParticipantUserIds).size !== sortedParticipantUserIds.length
  ) {
    throw new Error("Participants must be unique");
  }

  const baseAmount = total
    .dividedBy(sortedParticipantUserIds.length)
    .toDecimalPlaces(2, Decimal.ROUND_DOWN);
  const remainderInCents = total
    .minus(baseAmount.times(sortedParticipantUserIds.length))
    .dividedBy(CENT)
    .toNumber();

  return sortedParticipantUserIds.map((userId, index) => ({
    userId,
    splitAmount: formatAmount(
      baseAmount.plus(index < remainderInCents ? CENT : 0),
    ),
  }));
}

function validateSharedExpense(expense: SharedExpenseInput) {
  validateUserId(expense.id, "Expense ID");
  validateUserId(expense.paidByUserId, "Payer user ID");

  if (!expense.currency.trim()) {
    throw new Error("Currency is required");
  }

  const total = parseAmount(expense.amount, "Expense amount");

  if (!total.greaterThan(0)) {
    throw new Error("Expense amount must be greater than zero");
  }

  if (expense.participants.length === 0) {
    throw new Error("An expense must have at least one participant");
  }

  const participantUserIds = new Set<string>();
  const splitTotal = expense.participants.reduce((sum, participant) => {
    validateUserId(participant.userId, "Participant user ID");

    if (participantUserIds.has(participant.userId)) {
      throw new Error("Participants must be unique");
    }

    participantUserIds.add(participant.userId);
    return sum.plus(
      parseAmount(participant.splitAmount, "Participant split amount"),
    );
  }, new Decimal(0));

  if (!splitTotal.equals(total)) {
    throw new Error("Participant split amounts must equal the expense amount");
  }

  return total;
}

/**
 * Calculates balances and minimal settlement suggestions independently for
 * every currency. Inputs and outputs use exact two-decimal amount strings.
 */
export function calculateSharedExpenseLedger(
  expenses: SharedExpenseInput[],
): SharedExpenseCurrencyLedger[] {
  const balancesByCurrency = new Map<
    string,
    Map<string, { paid: Decimal; owed: Decimal }>
  >();

  for (const expense of expenses) {
    const total = validateSharedExpense(expense);
    const currency = expense.currency.trim().toUpperCase();
    const balances = balancesByCurrency.get(currency) ?? new Map();
    balancesByCurrency.set(currency, balances);

    const payerBalance = balances.get(expense.paidByUserId) ?? {
      paid: new Decimal(0),
      owed: new Decimal(0),
    };
    payerBalance.paid = payerBalance.paid.plus(total);
    balances.set(expense.paidByUserId, payerBalance);

    for (const participant of expense.participants) {
      const participantBalance = balances.get(participant.userId) ?? {
        paid: new Decimal(0),
        owed: new Decimal(0),
      };
      participantBalance.owed = participantBalance.owed.plus(
        parseAmount(participant.splitAmount, "Participant split amount"),
      );
      balances.set(participant.userId, participantBalance);
    }
  }

  return Array.from(balancesByCurrency.entries())
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, balances]) => {
      const balancesWithDecimals = Array.from(balances.entries())
        .map(([userId, balance]) => ({
          userId,
          paid: balance.paid,
          owed: balance.owed,
          net: balance.paid.minus(balance.owed),
        }))
        .sort((left, right) => left.userId.localeCompare(right.userId));

      return {
        currency,
        balances: balancesWithDecimals.map((balance) => ({
          userId: balance.userId,
          paid: formatAmount(balance.paid),
          owed: formatAmount(balance.owed),
          net: formatAmount(balance.net),
        })),
        settlements: calculateSettlements(balancesWithDecimals),
      };
    });
}

/**
 * Builds a traceable, user-centric ledger. Each member balance is derived only
 * from expenses directly shared with the current user, and currencies are
 * never combined.
 */
export function calculatePersonalExpenseLedger(
  expenses: PersonalExpenseInput[],
  currentUserId: string,
): PersonalExpenseCurrencyLedger[] {
  validateUserId(currentUserId, "Current user ID");

  const ledgersByCurrency = new Map<
    string,
    {
      totalSpent: Decimal;
      members: Map<
        string,
        {
          youOwe: Decimal;
          owedToYou: Decimal;
          items: PersonalExpenseBreakdownItem[];
        }
      >;
    }
  >();

  for (const expense of expenses) {
    const total = validateSharedExpense(expense);
    const currency = expense.currency.trim().toUpperCase();
    const ledger = ledgersByCurrency.get(currency) ?? {
      totalSpent: new Decimal(0),
      members: new Map(),
    };
    ledger.totalSpent = ledger.totalSpent.plus(total);
    ledgersByCurrency.set(currency, ledger);

    if (expense.paidByUserId === currentUserId) {
      for (const participant of expense.participants) {
        if (participant.userId === currentUserId) {
          continue;
        }

        const amount = parseAmount(
          participant.splitAmount,
          "Participant split amount",
        );
        if (amount.isZero()) {
          continue;
        }

        const member = ledger.members.get(participant.userId) ?? {
          youOwe: new Decimal(0),
          owedToYou: new Decimal(0),
          items: [],
        };
        member.owedToYou = member.owedToYou.plus(amount);
        member.items.push({
          id: expense.id,
          description: expense.description,
          context: expense.context,
          direction: "owed_to_you",
          amount: formatAmount(amount),
        });
        ledger.members.set(participant.userId, member);
      }
      continue;
    }

    const currentUserShare = expense.participants.find(
      (participant) => participant.userId === currentUserId,
    );
    if (!currentUserShare) {
      continue;
    }

    const amount = parseAmount(
      currentUserShare.splitAmount,
      "Participant split amount",
    );
    if (amount.isZero()) {
      continue;
    }

    const member = ledger.members.get(expense.paidByUserId) ?? {
      youOwe: new Decimal(0),
      owedToYou: new Decimal(0),
      items: [],
    };
    member.youOwe = member.youOwe.plus(amount);
    member.items.push({
      id: expense.id,
      description: expense.description,
      context: expense.context,
      direction: "you_owe",
      amount: formatAmount(amount),
    });
    ledger.members.set(expense.paidByUserId, member);
  }

  return Array.from(ledgersByCurrency.entries())
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, ledger]) => {
      let youOwe = new Decimal(0);
      let owedToYou = new Decimal(0);
      const members = Array.from(ledger.members.entries()).map(
        ([userId, member]) => {
          const net = member.owedToYou.minus(member.youOwe);
          const direction = net.isZero()
            ? "settled"
            : net.isPositive()
              ? "owed_to_you"
              : "you_owe";
          const amount = net.abs();

          if (direction === "you_owe") {
            youOwe = youOwe.plus(amount);
          } else if (direction === "owed_to_you") {
            owedToYou = owedToYou.plus(amount);
          }

          return {
            userId,
            direction,
            amount: formatAmount(amount),
            items: member.items,
          } satisfies PersonalExpenseMemberBalance;
        },
      );

      members.sort((left, right) => {
        const leftSettled = left.direction === "settled";
        const rightSettled = right.direction === "settled";

        if (leftSettled !== rightSettled) {
          return leftSettled ? 1 : -1;
        }

        return (
          new Decimal(right.amount).comparedTo(left.amount) ||
          left.userId.localeCompare(right.userId)
        );
      });

      return {
        currency,
        totalSpent: formatAmount(ledger.totalSpent),
        youOwe: formatAmount(youOwe),
        owedToYou: formatAmount(owedToYou),
        members,
      };
    });
}

function calculateSettlements(
  balances: { userId: string; net: Decimal }[],
): SharedExpenseSettlement[] {
  const creditors = balances
    .filter((balance) => balance.net.greaterThan(0))
    .map((balance) => ({ userId: balance.userId, remaining: balance.net }))
    .sort(
      (left, right) =>
        right.remaining.comparedTo(left.remaining) ||
        left.userId.localeCompare(right.userId),
    );
  const debtors = balances
    .filter((balance) => balance.net.lessThan(0))
    .map((balance) => ({
      userId: balance.userId,
      remaining: balance.net.negated(),
    }))
    .sort(
      (left, right) =>
        right.remaining.comparedTo(left.remaining) ||
        left.userId.localeCompare(right.userId),
    );
  const settlements: SharedExpenseSettlement[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Decimal.min(creditor.remaining, debtor.remaining);

    settlements.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount: formatAmount(amount),
    });

    creditor.remaining = creditor.remaining.minus(amount);
    debtor.remaining = debtor.remaining.minus(amount);

    if (creditor.remaining.isZero()) {
      creditorIndex += 1;
    }

    if (debtor.remaining.isZero()) {
      debtorIndex += 1;
    }
  }

  return settlements;
}
