# Income as Transactions — Design

## Problem

Income entries live in a separate `incomeEntries` table with no connection to accounts, payees, or transaction history. Adding income doesn't appear in transaction lists or affect account balances.

## Decision

Add `"income"` to the `transactionTypes` union and drop `incomeEntries`. Income becomes a regular transaction with `type: "income"`, linked to an account and payee.

## Schema

```
transactionTypes = v.union("expense", "transfer", "income")
```

Income transactions use the existing `transactions` table:
- `accountId` — required (the receiving account)
- `payeeId` — required (the income source)
- `categoryId` — undefined (income goes to Ready to Assign, not a category)
- `type` — `"income"`

The `incomeEntries` table is removed after migration.

## Budget Math

- **Ready to Assign**: Sum `transactions` where `type === "income"` and `date.startsWith(month)`, minus total allocations
- **Account Balance**: `initialBalance + sum(income) - sum(expenses)`

## UI

- Add Income dialog gains account and payee fields
- Income transactions appear in transaction lists with visual distinction
- Budget page and dashboard query transactions instead of incomeEntries

## Migration

1. Read all `incomeEntries`
2. Create income transaction for each (default "Income" payee, user's first account)
3. Delete income entries
4. Remove `incomeEntries` from schema

## Affected Files

- `convex/schema.ts` — type union, remove incomeEntries
- `convex/transactions.ts` — accept type param in create
- `convex/incomeEntries.ts` — remove after migration
- `src/lib/budget-math.ts` — update both functions
- `src/components/budget/AddIncomeDialog.tsx` — add account/payee fields
- `src/app/(app)/budget/page.tsx` — query transactions for income
- `src/app/(app)/dashboard/page.tsx` — same
- `src/app/api/ai/chat/route.ts` — update get_ready_to_assign tool
- Transaction list UI — show income with distinction
- Tests — update budget-math tests
