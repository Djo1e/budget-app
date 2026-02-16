# Income as Transactions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify income tracking into the transactions table by adding an `"income"` transaction type, eliminating the separate `incomeEntries` table.

**Architecture:** Add `"income"` to `transactionTypes` union. Income transactions use the same `transactions` table with `accountId`, `payeeId`, `date`, `amount`, and `type: "income"`. Budget math functions switch from querying `incomeEntries` to filtering income-type transactions. The `incomeEntries` table is removed after all references are migrated.

**Tech Stack:** Convex (schema + mutations/queries), React (UI components), Vitest (unit tests), TypeScript

---

### Task 1: Update budget-math types and tests

**Files:**
- Modify: `src/lib/budget-math.ts:1-8` (types)
- Modify: `src/lib/budget-math.ts:10-22` (calculateReadyToAssign)
- Modify: `src/lib/budget-math.ts:39-47` (calculateAccountBalance)
- Modify: `src/lib/__tests__/budget-math.test.ts`

**Step 1: Update the types and `calculateReadyToAssign` to accept transactions instead of income entries**

In `src/lib/budget-math.ts`, change the `Transaction` type to include `"income"` and rewrite `calculateReadyToAssign`:

```ts
type Allocation = { assignedAmount: number; month: string };
type Transaction = {
  amount: number;
  categoryId?: string;
  date: string;
  type: "expense" | "transfer" | "income";
};

export function calculateReadyToAssign(
  transactions: Transaction[],
  allocations: Allocation[],
  month: string
): number {
  const totalIncome = transactions
    .filter((t) => t.type === "income" && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllocated = allocations
    .filter((a) => a.month === month)
    .reduce((sum, a) => sum + a.assignedAmount, 0);
  return totalIncome - totalAllocated;
}
```

Remove the `IncomeEntry` type (no longer used).

**Step 2: Update `calculateAccountBalance` to add income**

```ts
export function calculateAccountBalance(
  initialBalance: number,
  transactions: { amount: number; type: "expense" | "transfer" | "income" }[]
): number {
  const totalSpent = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  return initialBalance + totalIncome - totalSpent;
}
```

**Step 3: Update tests in `src/lib/__tests__/budget-math.test.ts`**

Replace the `calculateReadyToAssign` tests to pass transactions instead of income entries:

```ts
describe("calculateReadyToAssign", () => {
  it("returns income minus allocations", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 1000, date: "2026-02-15", type: "income" as const, categoryId: undefined },
    ];
    const allocs = [
      { assignedAmount: 1500, month: "2026-02" },
      { assignedAmount: 500, month: "2026-02" },
    ];
    expect(calculateReadyToAssign(transactions, allocs, "2026-02")).toBe(2000);
  });

  it("returns full income when no allocations", () => {
    expect(
      calculateReadyToAssign(
        [{ amount: 4000, date: "2026-02-01", type: "income" as const, categoryId: undefined }],
        [],
        "2026-02"
      )
    ).toBe(4000);
  });

  it("returns negative when over-assigned", () => {
    expect(
      calculateReadyToAssign(
        [{ amount: 1000, date: "2026-02-01", type: "income" as const, categoryId: undefined }],
        [{ assignedAmount: 1500, month: "2026-02" }],
        "2026-02"
      )
    ).toBe(-500);
  });

  it("returns 0 when empty", () => {
    expect(calculateReadyToAssign([], [], "2026-02")).toBe(0);
  });

  it("filters by month", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 2000, date: "2026-01-15", type: "income" as const, categoryId: undefined },
    ];
    const allocs = [
      { assignedAmount: 1000, month: "2026-02" },
      { assignedAmount: 500, month: "2026-01" },
    ];
    expect(calculateReadyToAssign(transactions, allocs, "2026-02")).toBe(2000);
  });

  it("ignores expense transactions", () => {
    const transactions = [
      { amount: 3000, date: "2026-02-01", type: "income" as const, categoryId: undefined },
      { amount: 50, date: "2026-02-05", type: "expense" as const, categoryId: "cat1" },
    ];
    expect(calculateReadyToAssign(transactions, [], "2026-02")).toBe(3000);
  });
});
```

Add income test to `calculateAccountBalance`:

```ts
describe("calculateAccountBalance", () => {
  it("subtracts expenses from initial balance", () => {
    const txns = [
      { amount: 50, type: "expense" as const },
      { amount: 100, type: "expense" as const },
    ];
    expect(calculateAccountBalance(5000, txns)).toBe(4850);
  });

  it("adds income to balance", () => {
    const txns = [
      { amount: 3000, type: "income" as const },
      { amount: 50, type: "expense" as const },
    ];
    expect(calculateAccountBalance(1000, txns)).toBe(3950);
  });

  it("returns initial balance with no transactions", () => {
    expect(calculateAccountBalance(5000, [])).toBe(5000);
  });
});
```

**Step 4: Run tests**

Run: `npm test -- --run src/lib/__tests__/budget-math.test.ts`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/lib/budget-math.ts src/lib/__tests__/budget-math.test.ts
git commit -m "feat: update budget-math to use income transactions instead of incomeEntries"
```

---

### Task 2: Update Convex schema and transaction mutations

**Files:**
- Modify: `convex/schema.ts:11-14` (transactionTypes union)
- Modify: `convex/transactions.ts:90-108` (create mutation)

**Step 1: Add `"income"` to `transactionTypes` in `convex/schema.ts`**

```ts
export const transactionTypes = v.union(
  v.literal("expense"),
  v.literal("transfer"),
  v.literal("income")
);
```

Do NOT remove `incomeEntries` table from the schema yet — it still has data.

**Step 2: Update `transactions.create` to accept a `type` parameter**

In `convex/transactions.ts`, change the `create` mutation:

```ts
export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    amount: v.number(),
    date: v.string(),
    payeeId: v.id("payees"),
    categoryId: v.optional(v.id("categories")),
    accountId: v.id("accounts"),
    notes: v.optional(v.string()),
    type: v.optional(v.union(v.literal("expense"), v.literal("transfer"), v.literal("income"))),
  },
  handler: async (ctx, args) => {
    const { type: txType, ...rest } = args;
    const id = await ctx.db.insert("transactions", {
      ...rest,
      type: txType ?? "expense",
    });
    if ((txType ?? "expense") === "expense") {
      await autoLearnCategory(ctx, args.userId, args.payeeId);
    }
    return id;
  },
});
```

The `type` arg is optional and defaults to `"expense"` for backward compatibility — all existing callers that create expense transactions don't need changes.

**Step 3: Push schema changes**

Run: `npx convex dev --once`
Expected: Schema pushes successfully.

**Step 4: Commit**

```bash
git add convex/schema.ts convex/transactions.ts
git commit -m "feat: add income transaction type to schema and create mutation"
```

---

### Task 3: Update AddIncomeDialog to create income transactions

**Files:**
- Modify: `src/components/budget/AddIncomeDialog.tsx` (full rewrite)
- Modify: `src/app/(app)/budget/page.tsx:30-33,44,80-88,111-124,196,208`

**Step 1: Rewrite AddIncomeDialog to include account and payee fields**

Replace `src/components/budget/AddIncomeDialog.tsx` entirely:

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveFormContainer } from "@/components/ui/responsive-form-container";
import { Plus } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface AddIncomeDialogProps {
  onAdd: (data: {
    amount: number;
    date: string;
    payeeName: string;
    accountId: string;
  }) => void;
  month: string;
  accounts: Doc<"accounts">[];
  payees: Doc<"payees">[];
}

export function AddIncomeDialog({ onAdd, month, accounts, payees }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setPayeeName("");
      setAccountId(accounts[0]?._id ?? "");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, accounts]);

  const filteredPayees = useMemo(() => {
    if (!payeeName.trim()) return [];
    const lower = payeeName.toLowerCase();
    return payees.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [payeeName, payees]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    if (!payeeName.trim()) return;
    if (!accountId) return;
    onAdd({
      amount: Math.round(parsed * 100) / 100,
      date,
      payeeName: payeeName.trim(),
      accountId,
    });
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Income
      </Button>
      <ResponsiveFormContainer
        open={open}
        onOpenChange={setOpen}
        title="Add Income"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-amount">Amount</Label>
            <Input
              id="income-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="income-payee">Source</Label>
            <Input
              id="income-payee"
              placeholder="e.g. Employer, Freelance Client"
              value={payeeName}
              onChange={(e) => {
                setPayeeName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
              required
            />
            {showSuggestions && filteredPayees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                {filteredPayees.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => {
                      setPayeeName(p.name);
                      setShowSuggestions(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Deposit Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acct) => (
                  <SelectItem key={acct._id} value={acct._id}>
                    {acct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="income-date">Date</Label>
            <Input
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </ResponsiveFormContainer>
    </>
  );
}
```

**Step 2: Update budget page to use income transactions**

In `src/app/(app)/budget/page.tsx`:

1. Remove the `incomeEntries` query and `createIncome` mutation.
2. Add queries/mutations for accounts, payees, and `getOrCreatePayee`.
3. Change `totalIncome` to filter income-type transactions.
4. Rewrite `handleAddIncome` to create an income transaction.
5. Pass `accounts` and `payees` to `AddIncomeDialog`.
6. Update the loading guard to not check `incomeEntries`.

Remove these imports/lines:
- Remove: `import { api.incomeEntries... }` usage
- Add: `import type { Id } from "../../../../convex/_generated/dataModel";` (if not already imported)

Changes to the component:

```tsx
// Replace the incomeEntries query with accounts and payees queries
const accounts = useQuery(
  api.accounts.listByUser,
  userId ? { userId } : "skip"
);
const payees = useQuery(
  api.payees.listByUser,
  userId ? { userId } : "skip"
);

// Remove: const createIncome = useMutation(api.incomeEntries.create);
// Add:
const getOrCreatePayee = useMutation(api.payees.getOrCreate);
const createTransaction = useMutation(api.transactions.create);

// Replace totalIncome calculation:
const totalIncome = useMemo(
  () => (transactions ?? [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0),
  [transactions]
);

// Replace handleAddIncome:
async function handleAddIncome(data: {
  amount: number;
  date: string;
  payeeName: string;
  accountId: string;
}) {
  if (!userId) return;
  try {
    const payeeId = await getOrCreatePayee({ userId, name: data.payeeName });
    await createTransaction({
      userId,
      amount: data.amount,
      date: data.date,
      payeeId,
      accountId: data.accountId as Id<"accounts">,
      type: "income",
    });
  } catch {
    toast.error("Failed to add income");
  }
}

// Update loading guard — remove incomeEntries check, add accounts/payees:
if (!userId || !groups || !accounts || payees === undefined || allocations === undefined) {

// Update AddIncomeDialog usage:
<AddIncomeDialog onAdd={handleAddIncome} month={month} accounts={accounts} payees={payees} />
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/components/budget/AddIncomeDialog.tsx src/app/\(app\)/budget/page.tsx
git commit -m "feat: AddIncomeDialog creates income transactions with account and payee"
```

---

### Task 4: Update dashboard to use income transactions

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx:47-49,67-75,144-159,217-219`

**Step 1: Remove incomeEntries query, use transactions for income**

In `src/app/(app)/dashboard/page.tsx`:

1. Remove the `incomeEntries` query (lines 47-49).
2. Add a query for monthly transactions: `api.transactions.listByUserMonth`.
3. Update `readyToAssign` to use the new `calculateReadyToAssign` signature (transactions instead of incomeEntries).
4. Update loading guard to remove `incomeEntries` check.
5. Update `calculateAccountBalance` — no code change needed here since the function signature stays the same, but income transactions will now increase balances automatically.
6. Update the recent transactions display to distinguish income from expenses.

```tsx
// Remove:
// const incomeEntries = useQuery(
//   api.incomeEntries.listByUserMonth,
//   userId ? { userId, month } : "skip"
// );

// Add (for monthly transactions used in readyToAssign):
const monthlyTransactions = useQuery(
  api.transactions.listByUserMonth,
  userId ? { userId, month } : "skip"
);

// Update readyToAssign:
const readyToAssign = useMemo(
  () =>
    calculateReadyToAssign(
      monthlyTransactions ?? [],
      allocations ?? [],
      month
    ),
  [monthlyTransactions, allocations, month]
);

// Update loading guard — replace `incomeEntries === undefined` with `monthlyTransactions === undefined`:
if (
  !userId ||
  !accounts ||
  !categoryGroups ||
  payees === undefined ||
  monthlyTransactions === undefined ||
  allocations === undefined ||
  recentTransactions === undefined ||
  allTransactions === undefined
) {
```

Update the recent transactions display to show income with a different color:

```tsx
{recentTransactions.map((tx) => {
  const formattedDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );
  const isIncome = tx.type === "income";
  return (
    <div key={tx._id} className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-foreground shrink-0">{formattedDate}</span>
        <span className="font-medium truncate">
          {payeeMap[tx.payeeId]?.name ?? "Unknown"}
        </span>
      </div>
      <span className={`font-medium shrink-0 ml-2 ${isIncome ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
        {isIncome ? "+" : "-"}{formatCurrency(tx.amount, currency)}
      </span>
    </div>
  );
})}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat: dashboard uses income transactions for readyToAssign"
```

---

### Task 5: Update transaction list display for income

**Files:**
- Modify: `src/components/transactions/TransactionRow.tsx:42-44,59-60`

**Step 1: Show income amounts in green with + prefix**

In `TransactionRow.tsx`, update the amount display:

```tsx
// Add at top of component function:
const isIncome = transaction.type === "income";

// Desktop amount (replace line 42-44):
<span className={`text-right font-medium ${isIncome ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
  {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, currency)}
</span>

// Mobile amount (replace line 59-60):
<span className={`font-medium text-sm ${isIncome ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
  {isIncome ? "+" : "-"}{formatCurrency(transaction.amount, currency)}
</span>
```

Also update the category display to show "Income" instead of "Uncategorized" for income transactions:

```tsx
// Desktop category (line 40):
<span className="text-muted-foreground truncate">
  {isIncome ? "Income" : (categoryName ?? "Uncategorized")}
</span>

// Mobile category (line 66):
<span className="text-xs text-muted-foreground truncate ml-2">
  {isIncome ? "Income" : (categoryName ?? "Uncategorized")}
</span>
```

**Step 2: Commit**

```bash
git add src/components/transactions/TransactionRow.tsx
git commit -m "feat: show income transactions with green +amount in transaction list"
```

---

### Task 6: Update AI chat tools

**Files:**
- Modify: `src/app/api/ai/chat/route.ts:66-84`
- Modify: `src/lib/ai/chat-tools.ts:25-40`

**Step 1: Update `get_ready_to_assign` tool to use transactions**

In `src/app/api/ai/chat/route.ts`, replace the `get_ready_to_assign` execute function:

```ts
get_ready_to_assign: tool({
  description: "Get the ready-to-assign amount for a month",
  inputSchema: z.object({
    month: z.string().describe("Month in YYYY-MM format"),
  }),
  execute: async ({ month }) => {
    const transactions = await fetchAuthQuery(api.transactions.listByUserMonth, {
      userId,
      month,
    });
    const allocations = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, {
      userId,
      month,
    });
    const totalIncome = (transactions as { amount: number; type: string }[])
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const totalAllocated = (allocations as { assignedAmount: number }[]).reduce(
      (s, a) => s + a.assignedAmount,
      0
    );
    return `Ready to assign for ${month}: $${(totalIncome - totalAllocated).toFixed(2)} (Income: $${totalIncome.toFixed(2)}, Allocated: $${totalAllocated.toFixed(2)})`;
  },
}),
```

**Step 2: Update `formatAccountBalances` in `src/lib/ai/chat-tools.ts`**

```ts
export function formatAccountBalances(
  accounts: { name: string; initialBalance: number; _id: string; type: string }[],
  transactions: { amount: number; accountId: string; type: string }[]
): string {
  if (accounts.length === 0) return "No accounts found.";

  const lines = accounts.map((acct) => {
    const acctTx = transactions.filter((t) => t.accountId === acct._id);
    const spent = acctTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const income = acctTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = acct.initialBalance + income - spent;
    return `- ${acct.name} (${acct.type}): $${balance.toFixed(2)}`;
  });

  return `Account balances:\n${lines.join("\n")}`;
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/app/api/ai/chat/route.ts src/lib/ai/chat-tools.ts
git commit -m "feat: update AI chat tools to use income transactions"
```

---

### Task 7: Write and run migration, then remove incomeEntries

**Files:**
- Create: `convex/migrations/migrateIncomeToTransactions.ts`
- Modify: `convex/schema.ts:83-89` (remove incomeEntries table)
- Delete: `convex/incomeEntries.ts`

**Step 1: Create migration mutation**

Create `convex/migrations/migrateIncomeToTransactions.ts`:

```ts
import { mutation } from "../_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const allIncome = await ctx.db.query("incomeEntries").collect();
    if (allIncome.length === 0) return { migrated: 0 };

    const userAccountCache: Record<string, string> = {};
    const userPayeeCache: Record<string, string> = {};

    for (const entry of allIncome) {
      const userId = entry.userId;

      // Get or cache the user's first account
      if (!userAccountCache[userId]) {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
        if (accounts.length === 0) continue;
        userAccountCache[userId] = accounts[0]._id;
      }

      // Get or cache an "Income" payee for this user
      if (!userPayeeCache[userId]) {
        const existingPayees = await ctx.db
          .query("payees")
          .withIndex("by_userId_name", (q) =>
            q.eq("userId", userId).eq("name", "Income")
          )
          .collect();
        if (existingPayees.length > 0) {
          userPayeeCache[userId] = existingPayees[0]._id;
        } else {
          userPayeeCache[userId] = await ctx.db.insert("payees", {
            userId,
            name: "Income",
          });
        }
      }

      await ctx.db.insert("transactions", {
        userId,
        amount: entry.amount,
        type: "income",
        date: entry.date,
        payeeId: userPayeeCache[userId] as any,
        accountId: userAccountCache[userId] as any,
        notes: entry.label || undefined,
      });

      await ctx.db.delete(entry._id);
    }

    return { migrated: allIncome.length };
  },
});
```

**Step 2: Push the migration and run it**

Run: `npx convex dev --once`
Then run migration: `npx convex run migrations/migrateIncomeToTransactions:run`
Expected: Returns `{ migrated: N }` where N is the number of income entries.

**Step 3: Remove incomeEntries table from schema**

In `convex/schema.ts`, delete lines 83-89 (the `incomeEntries` table definition).

**Step 4: Delete `convex/incomeEntries.ts`**

Run: `rm convex/incomeEntries.ts`

**Step 5: Push schema changes**

Run: `npx convex dev --once`
Expected: Schema pushes successfully.

**Step 6: Commit**

```bash
git add convex/migrations/migrateIncomeToTransactions.ts convex/schema.ts
git rm convex/incomeEntries.ts
git commit -m "feat: migrate incomeEntries to transactions and remove incomeEntries table"
```

---

### Task 8: Run all tests and type check

**Step 1: Run unit tests**

Run: `npm test -- --run`
Expected: All tests pass.

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Verify no remaining references to incomeEntries**

Run: `grep -r "incomeEntries" --include="*.ts" --include="*.tsx" src/ convex/`
Expected: No matches (except possibly the migration file, which is fine).

**Step 4: Manual smoke test**

1. Open the app, go to Budget page
2. Click "Add Income" — verify it shows Amount, Source (payee), Deposit Account, and Date fields
3. Add income — verify it appears in the transaction list
4. Verify "Ready to Assign" updates correctly
5. Go to Accounts — verify account balance increased
6. Go to Transactions — verify income shows with green + amount

---

### Task 9: Final cleanup

**Step 1: Remove the migration file (optional, but keeps codebase clean)**

The migration has been run. It can be kept for reference or removed.

**Step 2: Run all tests one more time**

Run: `npm test -- --run`
Expected: All pass.

**Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final cleanup after income-as-transactions migration"
```
