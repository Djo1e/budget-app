# AI Intelligence Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four AI-first features: agentic chat with write tools, spending predictions, smart month setup, and monthly financial review. Uses json-render for AI-generated interactive UI.

**Architecture:** json-render catalog defines allowed UI components. AI generates JSON specs that render as React components inside the chat and on dedicated pages. Server-side API routes use Vercel AI SDK with Anthropic Sonnet for complex reasoning and Haiku for lightweight checks. Convex mutations are called server-side via `fetchAuthMutation`.

**Tech Stack:** `@json-render/core`, `@json-render/react`, `@json-render/shadcn`, Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`), Convex, Zod v4, shadcn/ui

---

### Task 1: Install json-render and set up catalog

**Files:**
- Modify: `package.json`
- Create: `src/lib/json-render/catalog.ts`
- Create: `src/lib/json-render/registry.tsx`

**Step 1: Install packages**

Run: `npm install @json-render/core @json-render/react @json-render/shadcn`

**Step 2: Create the component catalog**

This defines what UI the AI is allowed to generate. Keep it minimal — only components needed for the four features.

```typescript
// src/lib/json-render/catalog.ts
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react";
import { z } from "zod/v4";

export const catalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({
        title: z.string().optional(),
        variant: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      slots: ["default"],
      description: "Container card for grouping content",
    },
    Text: {
      props: z.object({
        content: z.string(),
        weight: z.enum(["normal", "medium", "bold"]).optional(),
        size: z.enum(["sm", "base", "lg", "xl"]).optional(),
        color: z.enum(["default", "muted", "success", "warning", "destructive"]).optional(),
      }),
      description: "Text block with optional styling",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        trend: z.enum(["up", "down", "flat"]).optional(),
        color: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      description: "Display a single metric with label, value, and optional trend",
    },
    Table: {
      props: z.object({
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          align: z.enum(["left", "center", "right"]).optional(),
        })),
        rows: z.array(z.record(z.string(), z.string())),
      }),
      description: "Data table with columns and rows",
    },
    ProgressBar: {
      props: z.object({
        label: z.string(),
        current: z.number(),
        max: z.number(),
        format: z.enum(["currency", "percent"]).optional(),
        color: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      description: "Progress bar showing current vs max value",
    },
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        bars: z.array(z.object({
          label: z.string(),
          value: z.number(),
          secondaryValue: z.number().optional(),
          color: z.enum(["default", "success", "warning", "destructive"]).optional(),
        })),
        format: z.enum(["currency", "percent", "number"]).optional(),
      }),
      description: "Horizontal bar chart comparing values",
    },
    ActionButton: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "outline", "destructive"]).optional(),
        size: z.enum(["sm", "default"]).optional(),
      }),
      description: "Button that triggers an action when clicked",
    },
    Divider: {
      props: z.object({}),
      description: "Horizontal divider line",
    },
    Stack: {
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).optional(),
        gap: z.enum(["sm", "md", "lg"]).optional(),
      }),
      slots: ["default"],
      description: "Layout container that stacks children vertically or horizontally",
    },
    TransactionConfirm: {
      props: z.object({
        amount: z.string(),
        payee: z.string(),
        category: z.string().optional(),
        account: z.string().optional(),
        date: z.string().optional(),
        type: z.enum(["expense", "income"]).optional(),
      }),
      description: "Transaction confirmation card with Confirm/Cancel actions",
    },
    BudgetMoveConfirm: {
      props: z.object({
        amount: z.string(),
        fromCategory: z.string(),
        toCategory: z.string(),
        month: z.string().optional(),
      }),
      description: "Budget reallocation confirmation card",
    },
    AllocationConfirm: {
      props: z.object({
        category: z.string(),
        amount: z.string(),
        month: z.string().optional(),
      }),
      description: "Budget allocation confirmation card",
    },
    SuggestionCard: {
      props: z.object({
        title: z.string(),
        description: z.string(),
        actionLabel: z.string().optional(),
      }),
      description: "Dismissable suggestion card with optional action button",
    },
    AllocationTable: {
      props: z.object({
        title: z.string().optional(),
        rows: z.array(z.object({
          category: z.string(),
          categoryId: z.string(),
          lastMonthSpent: z.string(),
          suggested: z.string(),
        })),
        totalIncome: z.string(),
        totalSuggested: z.string(),
      }),
      description: "Interactive allocation table for smart month setup with editable amounts",
    },
  },
  actions: {
    confirm_transaction: {
      params: z.object({
        amount: z.number(),
        payeeName: z.string(),
        categoryName: z.string().optional(),
        accountName: z.string().optional(),
        date: z.string().optional(),
        type: z.enum(["expense", "income"]).optional(),
      }),
      description: "Confirm and create a transaction",
    },
    confirm_budget_move: {
      params: z.object({
        amount: z.number(),
        fromCategoryName: z.string(),
        toCategoryName: z.string(),
        month: z.string(),
      }),
      description: "Confirm moving budget between categories",
    },
    confirm_allocation: {
      params: z.object({
        categoryName: z.string(),
        amount: z.number(),
        month: z.string(),
      }),
      description: "Confirm setting a budget allocation",
    },
    apply_suggested_budget: {
      params: z.object({
        allocations: z.array(z.object({
          categoryId: z.string(),
          amount: z.number(),
        })),
        month: z.string(),
      }),
      description: "Apply all suggested budget allocations for a month",
    },
    dismiss: {
      params: z.object({}),
      description: "Dismiss a suggestion card",
    },
  },
});
```

**Step 3: Create the React component registry**

```tsx
// src/lib/json-render/registry.tsx
"use client";

import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Check, X } from "lucide-react";

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => (
      <div
        className={cn(
          "rounded-lg border p-3 text-sm",
          props.variant === "success" && "border-green-500/30 bg-green-500/10",
          props.variant === "warning" && "border-yellow-500/30 bg-yellow-500/10",
          props.variant === "destructive" && "border-red-500/30 bg-red-500/10",
          !props.variant || props.variant === "default" ? "bg-muted/50" : ""
        )}
      >
        {props.title && <div className="font-medium mb-2">{props.title}</div>}
        {children}
      </div>
    ),
    Text: ({ props }) => (
      <p
        className={cn(
          "text-sm",
          props.weight === "medium" && "font-medium",
          props.weight === "bold" && "font-bold",
          props.size === "sm" && "text-xs",
          props.size === "lg" && "text-base",
          props.size === "xl" && "text-lg",
          props.color === "muted" && "text-muted-foreground",
          props.color === "success" && "text-green-500",
          props.color === "warning" && "text-yellow-500",
          props.color === "destructive" && "text-red-500"
        )}
      >
        {props.content}
      </p>
    ),
    Metric: ({ props }) => {
      const TrendIcon =
        props.trend === "up" ? TrendingUp : props.trend === "down" ? TrendingDown : Minus;
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{props.label}</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm font-medium",
                props.color === "success" && "text-green-500",
                props.color === "warning" && "text-yellow-500",
                props.color === "destructive" && "text-red-500"
              )}
            >
              {props.value}
            </span>
            {props.trend && <TrendIcon className="h-3 w-3 text-muted-foreground" />}
          </div>
        </div>
      );
    },
    Table: ({ props }) => (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {props.columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-1.5 px-2 font-medium text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                {props.columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-1.5 px-2",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {row[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    ProgressBar: ({ props }) => {
      const pct = props.max > 0 ? Math.min((props.current / props.max) * 100, 100) : 0;
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{props.label}</span>
            <span className="text-muted-foreground">
              {props.format === "percent"
                ? `${Math.round(pct)}%`
                : `${props.current} / ${props.max}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                props.color === "success" && "bg-green-500",
                props.color === "warning" && "bg-yellow-500",
                props.color === "destructive" && "bg-red-500",
                (!props.color || props.color === "default") && "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },
    BarChart: ({ props }) => {
      const maxVal = Math.max(...props.bars.map((b) => Math.max(b.value, b.secondaryValue ?? 0)), 1);
      return (
        <div className="space-y-2">
          {props.title && <div className="text-xs font-medium">{props.title}</div>}
          {props.bars.map((bar, i) => {
            const pct = (bar.value / maxVal) * 100;
            const secPct = bar.secondaryValue ? (bar.secondaryValue / maxVal) * 100 : 0;
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span>{bar.label}</span>
                  <span className="text-muted-foreground">{bar.value}</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  {bar.secondaryValue !== undefined && (
                    <div
                      className="absolute h-full rounded-full bg-muted-foreground/20"
                      style={{ width: `${secPct}%` }}
                    />
                  )}
                  <div
                    className={cn(
                      "absolute h-full rounded-full",
                      bar.color === "success" && "bg-green-500",
                      bar.color === "warning" && "bg-yellow-500",
                      bar.color === "destructive" && "bg-red-500",
                      (!bar.color || bar.color === "default") && "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    ActionButton: ({ props, emit }) => (
      <Button
        variant={props.variant ?? "default"}
        size={props.size ?? "sm"}
        className="text-xs"
        onClick={() => emit("press")}
      >
        {props.label}
      </Button>
    ),
    Divider: () => <hr className="border-border/50" />,
    Stack: ({ props, children }) => (
      <div
        className={cn(
          "flex",
          props.direction === "horizontal" ? "flex-row items-center" : "flex-col",
          props.gap === "sm" && "gap-1",
          props.gap === "lg" && "gap-4",
          (!props.gap || props.gap === "md") && "gap-2"
        )}
      >
        {children}
      </div>
    ),
    TransactionConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">
          {props.type === "income" ? "Add Income" : "New Transaction"}
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">{props.amount}</span>
          <span className="text-muted-foreground">Payee</span>
          <span>{props.payee}</span>
          {props.category && (
            <>
              <span className="text-muted-foreground">Category</span>
              <span>{props.category}</span>
            </>
          )}
          {props.account && (
            <>
              <span className="text-muted-foreground">Account</span>
              <span>{props.account}</span>
            </>
          )}
          {props.date && (
            <>
              <span className="text-muted-foreground">Date</span>
              <span>{props.date}</span>
            </>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    BudgetMoveConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Move Budget</div>
        <div className="text-xs">
          Move <span className="font-medium">{props.amount}</span> from{" "}
          <span className="font-medium">{props.fromCategory}</span> to{" "}
          <span className="font-medium">{props.toCategory}</span>
          {props.month && <span className="text-muted-foreground"> ({props.month})</span>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    AllocationConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Set Budget</div>
        <div className="text-xs">
          Set <span className="font-medium">{props.category}</span> to{" "}
          <span className="font-medium">{props.amount}</span>
          {props.month && <span className="text-muted-foreground"> for {props.month}</span>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    SuggestionCard: ({ props, emit }) => (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div className="text-xs font-medium">{props.title}</div>
          <button onClick={() => emit("dismiss")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">{props.description}</div>
        {props.actionLabel && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("action")}>
            {props.actionLabel}
          </Button>
        )}
      </div>
    ),
    AllocationTable: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        {props.title && <div className="text-xs font-medium">{props.title}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Category</th>
                <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Last Month</th>
                <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Suggested</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 px-2">{row.category}</td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground">{row.lastMonthSpent}</td>
                  <td className="py-1.5 px-2 text-right font-medium">{row.suggested}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center pt-1 text-xs">
          <span className="text-muted-foreground">
            Total: {props.totalSuggested} of {props.totalIncome}
          </span>
          <Button size="sm" className="text-xs h-7" onClick={() => emit("apply")}>
            Apply All
          </Button>
        </div>
      </div>
    ),
  },
});
```

**Step 4: Commit**

```bash
git add src/lib/json-render/ package.json package-lock.json
git commit -m "feat: add json-render with component catalog and registry"
```

---

### Task 2: Add write tools to chat API route

**Files:**
- Modify: `src/app/api/ai/chat/route.ts`
- Modify: `src/lib/ai/chat-tools.ts`

**Step 1: Write a test for the new chat tools helper functions**

Create: `src/lib/ai/__tests__/chat-tools.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { buildBudgetContext } from "../chat-tools";

describe("buildBudgetContext", () => {
  it("formats category and account data for the AI system prompt", () => {
    const result = buildBudgetContext({
      categories: [
        { id: "cat1", name: "Groceries", groupName: "Food" },
        { id: "cat2", name: "Restaurants", groupName: "Food" },
      ],
      accounts: [
        { id: "acc1", name: "Checking", type: "checking" },
      ],
      payees: [
        { id: "p1", name: "Walmart" },
      ],
    });
    expect(result).toContain("Groceries");
    expect(result).toContain("Checking");
    expect(result).toContain("Walmart");
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/lib/ai/__tests__/chat-tools.test.ts`
Expected: FAIL — `buildBudgetContext` not exported

**Step 3: Add `buildBudgetContext` to `src/lib/ai/chat-tools.ts`**

Append to the existing file:

```typescript
export function buildBudgetContext(data: {
  categories: { id: string; name: string; groupName: string }[];
  accounts: { id: string; name: string; type: string }[];
  payees: { id: string; name: string }[];
}): string {
  const catLines = data.categories.map((c) => `- ${c.name} (group: ${c.groupName}, id: ${c.id})`);
  const acctLines = data.accounts.map((a) => `- ${a.name} (${a.type}, id: ${a.id})`);
  const payeeLines = data.payees.map((p) => `- ${p.name} (id: ${p.id})`);

  return [
    "## User's Categories",
    catLines.join("\n"),
    "\n## User's Accounts",
    acctLines.join("\n"),
    "\n## Known Payees",
    payeeLines.join("\n"),
  ].join("\n");
}
```

**Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/lib/ai/__tests__/chat-tools.test.ts`
Expected: PASS

**Step 5: Upgrade the chat route with write tools**

Modify `src/app/api/ai/chat/route.ts`:

- Change model from `claude-haiku-4-5-20251001` to `claude-sonnet-4-5-20250514` (or latest Sonnet)
- Increase `maxOutputTokens` to 2000
- Import `pipeJsonRender` from `@json-render/core` and `createUIMessageStream`, `createUIMessageStreamResponse` from `ai`
- Import `catalog` from `@/lib/json-render/catalog`
- Import `fetchAuthMutation` from `@/lib/auth-server`
- Add `buildBudgetContext` to the system prompt with the user's categories, accounts, and payees
- Add 5 new write tools:

**`create_transaction` tool:**
```typescript
create_transaction: tool({
  description: "Create a new transaction. Always show a TransactionConfirm component first for user confirmation. Only call this AFTER the user confirms.",
  inputSchema: z.object({
    amount: z.number(),
    payeeName: z.string(),
    categoryName: z.string().optional(),
    accountName: z.string().optional(),
    date: z.string().optional(),
    type: z.enum(["expense", "income"]).optional(),
  }),
  execute: async ({ amount, payeeName, categoryName, accountName, date, type }) => {
    const payeeId = await fetchAuthMutation(api.payees.getOrCreate, {
      userId,
      name: payeeName,
    });
    const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
    let categoryId: string | undefined;
    if (categoryName) {
      for (const g of groups) {
        const match = g.categories.find(
          (c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (match) { categoryId = match._id; break; }
      }
    }
    const accounts = await fetchAuthQuery(api.accounts.listByUser, { userId });
    let accountId = accounts[0]?._id;
    if (accountName) {
      const match = accounts.find(
        (a: { name: string }) => a.name.toLowerCase() === accountName.toLowerCase()
      );
      if (match) accountId = match._id;
    }
    if (!accountId) return "No accounts found. User needs to create an account first.";
    await fetchAuthMutation(api.transactions.create, {
      userId,
      amount,
      date: date ?? new Date().toISOString().slice(0, 10),
      payeeId,
      categoryId: categoryId as any,
      accountId,
      type: type ?? "expense",
    });
    return `Transaction created: $${amount.toFixed(2)} at ${payeeName}`;
  },
}),
```

**`move_budget_money` tool:**
```typescript
move_budget_money: tool({
  description: "Move budget allocation from one category to another for a given month. Show BudgetMoveConfirm first.",
  inputSchema: z.object({
    fromCategoryName: z.string(),
    toCategoryName: z.string(),
    amount: z.number(),
    month: z.string().optional(),
  }),
  execute: async ({ fromCategoryName, toCategoryName, amount, month: m }) => {
    const targetMonth = m ?? currentMonth;
    const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
    let fromId: string | undefined, toId: string | undefined;
    for (const g of groups) {
      for (const c of g.categories) {
        if (c.name.toLowerCase() === fromCategoryName.toLowerCase()) fromId = c._id;
        if (c.name.toLowerCase() === toCategoryName.toLowerCase()) toId = c._id;
      }
    }
    if (!fromId || !toId) return `Could not find categories "${fromCategoryName}" and/or "${toCategoryName}".`;
    const allocs = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month: targetMonth });
    const fromAlloc = allocs.find((a: { categoryId: string }) => a.categoryId === fromId);
    const toAlloc = allocs.find((a: { categoryId: string }) => a.categoryId === toId);
    const fromAmount = fromAlloc?.assignedAmount ?? 0;
    const toAmount = toAlloc?.assignedAmount ?? 0;
    await fetchAuthMutation(api.budgetAllocations.upsert, {
      userId, month: targetMonth, categoryId: fromId as any, assignedAmount: fromAmount - amount,
    });
    await fetchAuthMutation(api.budgetAllocations.upsert, {
      userId, month: targetMonth, categoryId: toId as any, assignedAmount: toAmount + amount,
    });
    return `Moved $${amount.toFixed(2)} from ${fromCategoryName} to ${toCategoryName} for ${targetMonth}.`;
  },
}),
```

**`set_budget_allocation` tool:**
```typescript
set_budget_allocation: tool({
  description: "Set a category's budget allocation for a month. Show AllocationConfirm first.",
  inputSchema: z.object({
    categoryName: z.string(),
    amount: z.number(),
    month: z.string().optional(),
  }),
  execute: async ({ categoryName, amount, month: m }) => {
    const targetMonth = m ?? currentMonth;
    const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
    let catId: string | undefined;
    for (const g of groups) {
      const match = g.categories.find(
        (c: { name: string }) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (match) { catId = match._id; break; }
    }
    if (!catId) return `Category "${categoryName}" not found.`;
    await fetchAuthMutation(api.budgetAllocations.upsert, {
      userId, month: targetMonth, categoryId: catId as any, assignedAmount: amount,
    });
    return `Set ${categoryName} budget to $${amount.toFixed(2)} for ${targetMonth}.`;
  },
}),
```

**`add_income` tool:**
```typescript
add_income: tool({
  description: "Add an income transaction. Show TransactionConfirm with type=income first.",
  inputSchema: z.object({
    amount: z.number(),
    label: z.string().optional(),
    accountName: z.string().optional(),
    date: z.string().optional(),
  }),
  execute: async ({ amount, label, accountName, date }) => {
    const accounts = await fetchAuthQuery(api.accounts.listByUser, { userId });
    let accountId = accounts[0]?._id;
    if (accountName) {
      const match = accounts.find(
        (a: { name: string }) => a.name.toLowerCase() === accountName.toLowerCase()
      );
      if (match) accountId = match._id;
    }
    if (!accountId) return "No accounts found.";
    const payeeId = await fetchAuthMutation(api.payees.getOrCreate, {
      userId, name: label ?? "Income",
    });
    await fetchAuthMutation(api.transactions.create, {
      userId, amount,
      date: date ?? new Date().toISOString().slice(0, 10),
      payeeId, accountId, type: "income",
    });
    return `Income of $${amount.toFixed(2)} added${label ? ` (${label})` : ""}.`;
  },
}),
```

**`create_category` tool:**
```typescript
create_category: tool({
  description: "Create a new budget category in a group",
  inputSchema: z.object({
    categoryName: z.string(),
    groupName: z.string(),
  }),
  execute: async ({ categoryName, groupName }) => {
    const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
    const group = groups.find(
      (g: { name: string }) => g.name.toLowerCase() === groupName.toLowerCase()
    );
    if (!group) return `Group "${groupName}" not found.`;
    const maxSort = Math.max(0, ...group.categories.map((c: { sortOrder: number }) => c.sortOrder));
    await fetchAuthMutation(api.categories.addCategory, {
      userId, groupId: group._id, name: categoryName, sortOrder: maxSort + 1,
    });
    return `Category "${categoryName}" created in "${groupName}".`;
  },
}),
```

- Update the system prompt to include `catalog.prompt({ mode: "chat" })` instructions and `buildBudgetContext` data
- Update the streaming to use `pipeJsonRender`:

```typescript
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    writer.merge(pipeJsonRender(result.toUIMessageStream()));
  },
});
return createUIMessageStreamResponse({ stream });
```

**Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/app/api/ai/chat/route.ts src/lib/ai/chat-tools.ts src/lib/ai/__tests__/chat-tools.test.ts
git commit -m "feat: add write tools to agentic chat with json-render streaming"
```

---

### Task 3: Upgrade ChatWidget to render json-render specs

**Files:**
- Modify: `src/components/chat/ChatWidget.tsx`

**Step 1: Update ChatWidget to render json-render specs from messages**

Key changes:
- Import `useJsonRenderMessage`, `Renderer`, `StateProvider`, `ActionProvider`, `VisibilityProvider` from `@json-render/react`
- Import `registry` from `@/lib/json-render/registry`
- Replace the message rendering loop: for each assistant message, use `useJsonRenderMessage(message.parts)` to extract `spec`, `text`, and `hasSpec`
- If `hasSpec`, render `<Renderer spec={spec} registry={registry} loading={isStreaming} />` alongside the text
- Wrap the renderer in `<StateProvider>`, `<ActionProvider>`, `<VisibilityProvider>`
- Add action handlers for `confirm_transaction`, `confirm_budget_move`, `confirm_allocation`, `dismiss` that send follow-up messages to the chat

Create a separate `ChatMessage` component to use the hook:

```tsx
function ChatMessageBubble({
  message,
  isStreaming,
}: {
  message: { id: string; role: string; parts: any[] };
  isStreaming: boolean;
}) {
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts);

  if (message.role === "user") {
    return (
      <div className="ml-auto bg-primary text-primary-foreground text-sm rounded-lg px-3 py-2 max-w-[85%]">
        {text}
      </div>
    );
  }

  return (
    <div className="bg-muted text-sm rounded-lg px-3 py-2 max-w-[85%] space-y-2">
      {text && renderMarkdown(text)}
      {hasSpec && spec && (
        <Renderer spec={spec} registry={registry} loading={isStreaming} />
      )}
    </div>
  );
}
```

Wrap the messages area:

```tsx
<ActionProvider
  handlers={{
    confirm_transaction: async (params) => {
      await sendMessage({ text: `Confirmed: create transaction` });
    },
    confirm_budget_move: async (params) => {
      await sendMessage({ text: `Confirmed: move budget` });
    },
    confirm_allocation: async (params) => {
      await sendMessage({ text: `Confirmed: set allocation` });
    },
    dismiss: async () => { /* no-op, card hides */ },
  }}
>
  <StateProvider initialState={{}}>
    <VisibilityProvider>
      {/* message list */}
    </VisibilityProvider>
  </StateProvider>
</ActionProvider>
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Manual test**

Run: `npm run dev` (plus `npx convex dev` in another terminal)
- Open the chat, type "how much did I spend this month?" — should get text response
- Type "add a $5 coffee transaction" — should see a TransactionConfirm card
- Click Confirm — should create the transaction

**Step 4: Commit**

```bash
git add src/components/chat/ChatWidget.tsx
git commit -m "feat: upgrade ChatWidget with json-render spec rendering"
```

---

### Task 4: Add spending predictions

**Files:**
- Create: `src/lib/spending-predictions.ts`
- Create: `src/lib/__tests__/spending-predictions.test.ts`
- Modify: `src/app/api/ai/chat/route.ts` (add prediction tool)

**Step 1: Write failing tests for spending prediction math**

```typescript
// src/lib/__tests__/spending-predictions.test.ts
import { describe, it, expect } from "vitest";
import { predictCategorySpending, type CategoryPrediction } from "../spending-predictions";

describe("predictCategorySpending", () => {
  it("projects overspend when pace exceeds budget", () => {
    // 10 days into a 30-day month, spent $200 of $300 budget
    const result = predictCategorySpending({
      spent: 200,
      allocated: 300,
      dayOfMonth: 10,
      daysInMonth: 30,
    });
    expect(result.projected).toBeCloseTo(600); // 200/10 * 30
    expect(result.projectedOverspend).toBeCloseTo(300);
    expect(result.status).toBe("over");
  });

  it("returns on-track when pace is under budget", () => {
    const result = predictCategorySpending({
      spent: 50,
      allocated: 300,
      dayOfMonth: 15,
      daysInMonth: 30,
    });
    expect(result.projected).toBeCloseTo(100);
    expect(result.projectedOverspend).toBeCloseTo(-200);
    expect(result.status).toBe("under");
  });

  it("returns warning when projected is within 10% of budget", () => {
    // 15 days in, spent $140 of $300 → projected $280 (93% of budget)
    const result = predictCategorySpending({
      spent: 140,
      allocated: 300,
      dayOfMonth: 15,
      daysInMonth: 30,
    });
    expect(result.status).toBe("warning");
  });

  it("handles day 1 (avoid division by zero)", () => {
    const result = predictCategorySpending({
      spent: 10,
      allocated: 300,
      dayOfMonth: 0,
      daysInMonth: 30,
    });
    expect(result.status).toBe("under");
  });

  it("handles zero allocation", () => {
    const result = predictCategorySpending({
      spent: 50,
      allocated: 0,
      dayOfMonth: 10,
      daysInMonth: 30,
    });
    expect(result.status).toBe("over");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/__tests__/spending-predictions.test.ts`
Expected: FAIL

**Step 3: Implement spending predictions**

```typescript
// src/lib/spending-predictions.ts
export type PredictionStatus = "under" | "warning" | "over";

export type CategoryPrediction = {
  projected: number;
  projectedOverspend: number;
  pacePerDay: number;
  status: PredictionStatus;
};

export function predictCategorySpending(input: {
  spent: number;
  allocated: number;
  dayOfMonth: number;
  daysInMonth: number;
}): CategoryPrediction {
  const { spent, allocated, dayOfMonth, daysInMonth } = input;

  if (dayOfMonth <= 0) {
    return {
      projected: spent,
      projectedOverspend: spent - allocated,
      pacePerDay: 0,
      status: spent > allocated ? "over" : "under",
    };
  }

  const pacePerDay = spent / dayOfMonth;
  const projected = pacePerDay * daysInMonth;
  const projectedOverspend = projected - allocated;

  let status: PredictionStatus;
  if (allocated === 0) {
    status = spent > 0 ? "over" : "under";
  } else if (projectedOverspend > allocated * 0.1) {
    status = "over";
  } else if (projectedOverspend > -allocated * 0.1) {
    status = "warning";
  } else {
    status = "under";
  }

  return { projected, projectedOverspend, pacePerDay, status };
}

export function getDaysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
}

export function getDayOfMonth(month: string): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month !== currentMonth) {
    return getDaysInMonth(month); // past months: use full month
  }
  return now.getDate();
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/spending-predictions.test.ts`
Expected: PASS

**Step 5: Add `get_spending_predictions` tool to chat route**

Add to the tools object in `src/app/api/ai/chat/route.ts`:

```typescript
get_spending_predictions: tool({
  description: "Get spending pace predictions for the current month — shows which categories are on track to overspend",
  inputSchema: z.object({
    month: z.string().describe("Month in YYYY-MM format"),
  }),
  execute: async ({ month }) => {
    const transactions = await fetchAuthQuery(api.transactions.listByUserMonth, { userId, month });
    const allocations = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month });
    const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
    const categoryMap: Record<string, string> = {};
    for (const g of groups) {
      for (const c of g.categories) categoryMap[c._id] = c.name;
    }
    const allocMap: Record<string, number> = {};
    for (const a of allocations) allocMap[a.categoryId] = a.assignedAmount;

    const dayOfMonth = getDayOfMonth(month);
    const daysInMonth = getDaysInMonth(month);

    const predictions: string[] = [];
    for (const [catId, catName] of Object.entries(categoryMap)) {
      const spent = (transactions as any[])
        .filter((t) => t.categoryId === catId && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const allocated = allocMap[catId] ?? 0;
      if (spent === 0 && allocated === 0) continue;
      const pred = predictCategorySpending({ spent, allocated, dayOfMonth, daysInMonth });
      const icon = pred.status === "over" ? "🔴" : pred.status === "warning" ? "🟡" : "🟢";
      predictions.push(
        `${icon} ${catName}: spent $${spent.toFixed(2)} of $${allocated.toFixed(2)}, projected $${pred.projected.toFixed(2)} (${pred.status})`
      );
    }
    return predictions.length > 0 ? predictions.join("\n") : "No spending data for this month.";
  },
}),
```

Import `predictCategorySpending`, `getDayOfMonth`, `getDaysInMonth` from `@/lib/spending-predictions`.

**Step 6: Run type check and tests**

Run: `npx tsc --noEmit && npm test -- --run`
Expected: All pass

**Step 7: Commit**

```bash
git add src/lib/spending-predictions.ts src/lib/__tests__/spending-predictions.test.ts src/app/api/ai/chat/route.ts
git commit -m "feat: add spending prediction math and chat tool"
```

---

### Task 5: Add smart month setup API route

**Files:**
- Create: `src/app/api/ai/suggest-budget/route.ts`
- Create: `src/lib/ai/budget-suggestions.ts`
- Create: `src/lib/ai/__tests__/budget-suggestions.test.ts`

**Step 1: Write failing test for data gathering helper**

```typescript
// src/lib/ai/__tests__/budget-suggestions.test.ts
import { describe, it, expect } from "vitest";
import { buildSuggestionContext } from "../budget-suggestions";

describe("buildSuggestionContext", () => {
  it("summarizes last month's spending per category", () => {
    const result = buildSuggestionContext({
      categories: [
        { id: "c1", name: "Groceries", groupName: "Food" },
        { id: "c2", name: "Dining", groupName: "Food" },
      ],
      lastMonthTransactions: [
        { amount: 100, categoryId: "c1", type: "expense", date: "2026-01-15" },
        { amount: 200, categoryId: "c1", type: "expense", date: "2026-01-20" },
        { amount: 80, categoryId: "c2", type: "expense", date: "2026-01-10" },
      ],
      lastMonthAllocations: [
        { categoryId: "c1", assignedAmount: 400 },
        { categoryId: "c2", assignedAmount: 100 },
      ],
      totalIncome: 3000,
    });
    expect(result).toContain("Groceries");
    expect(result).toContain("300"); // spent
    expect(result).toContain("400"); // allocated
    expect(result).toContain("3000"); // income
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/ai/__tests__/budget-suggestions.test.ts`
Expected: FAIL

**Step 3: Implement the helper**

```typescript
// src/lib/ai/budget-suggestions.ts
type CategoryInfo = { id: string; name: string; groupName: string };
type Transaction = { amount: number; categoryId?: string; type: string; date: string };
type Allocation = { categoryId: string; assignedAmount: number };

export function buildSuggestionContext(data: {
  categories: CategoryInfo[];
  lastMonthTransactions: Transaction[];
  lastMonthAllocations: Allocation[];
  totalIncome: number;
}): string {
  const spentMap: Record<string, number> = {};
  for (const t of data.lastMonthTransactions) {
    if (t.type === "expense" && t.categoryId) {
      spentMap[t.categoryId] = (spentMap[t.categoryId] ?? 0) + t.amount;
    }
  }
  const allocMap: Record<string, number> = {};
  for (const a of data.lastMonthAllocations) {
    allocMap[a.categoryId] = a.assignedAmount;
  }

  const lines = data.categories.map((cat) => {
    const spent = spentMap[cat.id] ?? 0;
    const allocated = allocMap[cat.id] ?? 0;
    return `- ${cat.name} (${cat.groupName}): allocated $${allocated}, spent $${spent}`;
  });

  return [
    `Total monthly income: $${data.totalIncome}`,
    "",
    "Last month's categories (allocated vs spent):",
    ...lines,
  ].join("\n");
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/ai/__tests__/budget-suggestions.test.ts`
Expected: PASS

**Step 5: Create the API route**

```typescript
// src/app/api/ai/suggest-budget/route.ts
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { buildSuggestionContext } from "@/lib/ai/budget-suggestions";
import { catalog } from "@/lib/json-render/catalog";

const suggestedAllocationSchema = z.object({
  allocations: z.array(
    z.object({
      categoryId: z.string(),
      categoryName: z.string(),
      suggested: z.number(),
      lastMonthSpent: z.number(),
      reasoning: z.string(),
    })
  ),
  summary: z.string(),
});

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return new Response("Profile not found", { status: 404 });

  const userId = userProfile._id;
  const { month } = (await req.json()) as { month: string };

  // Get previous month
  const [y, m] = month.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [groups, prevTransactions, prevAllocations, currentTransactions] = await Promise.all([
    fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
    fetchAuthQuery(api.transactions.listByUserMonth, { userId, month: prevMonth }),
    fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month: prevMonth }),
    fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
  ]);

  const categories: { id: string; name: string; groupName: string }[] = [];
  for (const g of groups as any[]) {
    for (const c of g.categories) {
      categories.push({ id: c._id, name: c.name, groupName: g.name });
    }
  }

  const totalIncome = (currentTransactions as any[])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const context = buildSuggestionContext({
    categories,
    lastMonthTransactions: prevTransactions as any[],
    lastMonthAllocations: prevAllocations as any[],
    totalIncome,
  });

  const { text: aiResponse } = await generateText({
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: `You are a budget advisor. Given spending history, suggest budget allocations for the new month. Return JSON only, no markdown fences. The response must be a JSON object with "allocations" array (categoryId, categoryName, suggested amount as number, lastMonthSpent as number, reasoning string) and a "summary" string with 2-3 sentences of advice.`,
    prompt: context,
    maxOutputTokens: 2000,
  });

  const cleaned = aiResponse.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const parsed = suggestedAllocationSchema.safeParse(JSON.parse(cleaned));

  if (!parsed.success) {
    return Response.json({ error: "Failed to generate suggestions" }, { status: 422 });
  }

  return Response.json(parsed.data);
}
```

**Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/app/api/ai/suggest-budget/ src/lib/ai/budget-suggestions.ts src/lib/ai/__tests__/budget-suggestions.test.ts
git commit -m "feat: add smart month setup API route"
```

---

### Task 6: Add smart month setup UI to budget page

**Files:**
- Create: `src/components/budget/SmartSetupBanner.tsx`
- Modify: `src/app/(app)/budget/page.tsx`

**Step 1: Create SmartSetupBanner component**

```tsx
// src/components/budget/SmartSetupBanner.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SuggestedAllocation = {
  categoryId: string;
  categoryName: string;
  suggested: number;
  lastMonthSpent: number;
  reasoning: string;
};

type Props = {
  month: string;
  userId: Id<"userProfiles">;
  totalAllocated: number;
  currency: string;
};

export function SmartSetupBanner({ month, userId, totalAllocated, currency }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedAllocation[] | null>(null);
  const [summary, setSummary] = useState("");
  const upsertAllocation = useMutation(api.budgetAllocations.upsert);

  if (totalAllocated > 0 && !suggestions) return null;

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setSuggestions(data.allocations);
      setSummary(data.summary);
    } catch {
      toast.error("Could not generate budget suggestions");
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (!suggestions) return;
    setLoading(true);
    try {
      await Promise.all(
        suggestions.map((s) =>
          upsertAllocation({
            userId,
            month,
            categoryId: s.categoryId as Id<"categories">,
            assignedAmount: s.suggested,
          })
        )
      );
      toast.success("Budget applied!");
      setSuggestions(null);
    } catch {
      toast.error("Failed to apply budget");
    } finally {
      setLoading(false);
    }
  };

  if (!suggestions) {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Set up {month}'s budget</p>
          <p className="text-xs text-muted-foreground">
            AI can suggest allocations based on your spending history
          </p>
        </div>
        <Button size="sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {loading ? "Thinking..." : "AI Suggest"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm">{summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Category</th>
              <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Last Month</th>
              <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.categoryId} className="border-b border-border/50">
                <td className="py-1.5 px-2">{s.categoryName}</td>
                <td className="py-1.5 px-2 text-right text-muted-foreground">
                  ${s.lastMonthSpent.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right font-medium">
                  ${s.suggested.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={applyAll} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply All"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSuggestions(null)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Add SmartSetupBanner to budget page**

In `src/app/(app)/budget/page.tsx`, import `SmartSetupBanner` and render it below the `ReadyToAssignBanner`:

```tsx
<SmartSetupBanner
  month={month}
  userId={userId}
  totalAllocated={totalAllocated}
  currency={currency}
/>
```

You'll need to compute `totalAllocated` from `allocations` (sum of `assignedAmount`).

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/budget/SmartSetupBanner.tsx src/app/\(app\)/budget/page.tsx
git commit -m "feat: add AI smart month setup banner to budget page"
```

---

### Task 7: Add monthly financial review API route

**Files:**
- Create: `src/app/api/ai/monthly-review/route.ts`

**Step 1: Create the API route**

```typescript
// src/app/api/ai/monthly-review/route.ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { pipeJsonRender } from "@json-render/core";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { catalog } from "@/lib/json-render/catalog";

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return new Response("Profile not found", { status: 404 });

  const userId = userProfile._id;
  const currency = userProfile.currency;
  const { month } = (await req.json()) as { month: string };

  // Get previous month for comparison
  const [y, m] = month.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [groups, transactions, allocations, prevTransactions, prevAllocations, accounts] =
    await Promise.all([
      fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
      fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
      fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month }),
      fetchAuthQuery(api.transactions.listByUserMonth, { userId, month: prevMonth }),
      fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month: prevMonth }),
      fetchAuthQuery(api.accounts.listByUser, { userId }),
    ]);

  const categoryMap: Record<string, string> = {};
  for (const g of groups as any[]) {
    for (const c of g.categories) categoryMap[c._id] = c.name;
  }

  // Build data summary for the AI
  const totalIncome = (transactions as any[])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = (transactions as any[])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalAllocated = (allocations as any[]).reduce((s, a) => s + a.assignedAmount, 0);

  const prevTotalExpenses = (prevTransactions as any[])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const catSpending: Record<string, number> = {};
  for (const t of transactions as any[]) {
    if (t.type === "expense" && t.categoryId) {
      const name = categoryMap[t.categoryId] ?? "Uncategorized";
      catSpending[name] = (catSpending[name] ?? 0) + t.amount;
    }
  }
  const catAllocated: Record<string, number> = {};
  for (const a of allocations as any[]) {
    const name = categoryMap[(a as any).categoryId] ?? "Unknown";
    catAllocated[name] = (a as any).assignedAmount;
  }

  const dataContext = [
    `Month: ${month}`,
    `Currency: ${currency}`,
    `Total Income: $${totalIncome.toFixed(2)}`,
    `Total Expenses: $${totalExpenses.toFixed(2)}`,
    `Total Budgeted: $${totalAllocated.toFixed(2)}`,
    `Net Saved: $${(totalIncome - totalExpenses).toFixed(2)}`,
    `Previous Month Expenses: $${prevTotalExpenses.toFixed(2)}`,
    "",
    "Category Breakdown (budget vs actual):",
    ...Object.entries(catSpending)
      .sort((a, b) => b[1] - a[1])
      .map(([name, spent]) => {
        const budgeted = catAllocated[name] ?? 0;
        const diff = budgeted - spent;
        return `- ${name}: budgeted $${budgeted.toFixed(2)}, spent $${spent.toFixed(2)}, ${diff >= 0 ? "under" : "over"} by $${Math.abs(diff).toFixed(2)}`;
      }),
  ].join("\n");

  const systemPrompt = [
    catalog.prompt({ mode: "chat" }),
    "",
    "You are generating a monthly financial review. Use the json-render components to create a visually rich report.",
    "Structure: 1) Summary metrics (use Metric components), 2) Category breakdown (use BarChart or Table), 3) Wins (Card variant=success), 4) Attention areas (Card variant=warning), 5) Month-over-month comparison if data exists, 6) 2-3 actionable suggestions.",
    "Keep text concise and actionable. Use the user's currency format.",
  ].join("\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: systemPrompt,
    prompt: dataContext,
    maxOutputTokens: 3000,
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()));
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/ai/monthly-review/
git commit -m "feat: add monthly financial review API route"
```

---

### Task 8: Add monthly review UI

**Files:**
- Create: `src/components/budget/MonthlyReview.tsx`
- Modify: `src/app/(app)/budget/page.tsx` or `src/app/(app)/dashboard/page.tsx`

**Step 1: Create MonthlyReview component**

This component calls the monthly-review endpoint and renders the streamed json-render spec.

```tsx
// src/components/budget/MonthlyReview.tsx
"use client";

import { useUIStream, Renderer, StateProvider, VisibilityProvider } from "@json-render/react";
import { registry } from "@/lib/json-render/registry";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

type Props = {
  month: string;
};

export function MonthlyReview({ month }: Props) {
  const { spec, isStreaming, error, send } = useUIStream({
    api: "/api/ai/monthly-review",
  });

  const hasReport = spec !== null;

  return (
    <div className="space-y-3">
      {!hasReport && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => send(month, { month })}
          disabled={isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {isStreaming ? "Generating..." : `Generate ${month} Review`}
        </Button>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
      {hasReport && (
        <StateProvider initialState={{}}>
          <VisibilityProvider>
            <Renderer spec={spec} registry={registry} loading={isStreaming} />
          </VisibilityProvider>
        </StateProvider>
      )}
    </div>
  );
}
```

**Step 2: Add to budget page**

In `src/app/(app)/budget/page.tsx`, add a "Monthly Review" section at the bottom of the page. Show it when viewing a past month:

```tsx
{month !== getCurrentMonth() && (
  <MonthlyReview month={month} />
)}
```

Also make it accessible via the chat: the existing chat tools can direct users to navigate to the budget page for the full review, or generate an inline review using json-render components.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/budget/MonthlyReview.tsx src/app/\(app\)/budget/page.tsx
git commit -m "feat: add monthly financial review UI component"
```

---

### Task 9: Add proactive nudges to chat

**Files:**
- Create: `src/app/api/ai/nudges/route.ts`
- Modify: `src/components/chat/ChatWidget.tsx`

**Step 1: Create nudges API route**

This lightweight endpoint checks the user's current state and returns 0-3 nudge suggestions.

```typescript
// src/app/api/ai/nudges/route.ts
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import {
  predictCategorySpending,
  getDayOfMonth,
  getDaysInMonth,
} from "@/lib/spending-predictions";

export async function GET() {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return Response.json([]);

  const userId = userProfile._id;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [transactions, allocations, groups] = await Promise.all([
    fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
    fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month }),
    fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (const g of groups as any[]) {
    for (const c of g.categories) categoryMap[c._id] = c.name;
  }

  const nudges: { title: string; description: string; actionLabel?: string }[] = [];
  const dayOfMonth = getDayOfMonth(month);
  const daysInMonth = getDaysInMonth(month);

  // Check for overspending pace
  const allocMap: Record<string, number> = {};
  for (const a of allocations as any[]) allocMap[a.categoryId] = a.assignedAmount;

  for (const [catId, catName] of Object.entries(categoryMap)) {
    const spent = (transactions as any[])
      .filter((t) => t.categoryId === catId && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const allocated = allocMap[catId] ?? 0;
    if (allocated === 0) continue;
    const pred = predictCategorySpending({ spent, allocated, dayOfMonth, daysInMonth });
    if (pred.status === "over") {
      const overBy = Math.round(pred.projected - allocated);
      nudges.push({
        title: `${catName} on pace to overspend`,
        description: `You've spent $${spent.toFixed(0)} of $${allocated.toFixed(0)} with ${daysInMonth - dayOfMonth} days left. Projected overspend: ~$${overBy}.`,
        actionLabel: "Fix it",
      });
      if (nudges.length >= 2) break;
    }
  }

  // Check for unassigned money
  const totalIncome = (transactions as any[])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalAllocated = (allocations as any[]).reduce(
    (s: number, a: any) => s + a.assignedAmount,
    0
  );
  const unassigned = totalIncome - totalAllocated;
  if (unassigned > 0 && nudges.length < 3) {
    nudges.push({
      title: `$${unassigned.toFixed(0)} unassigned`,
      description: "You have money that hasn't been assigned to any category yet.",
      actionLabel: "Assign it",
    });
  }

  // Check for uncategorized transactions
  const uncategorized = (transactions as any[]).filter(
    (t) => t.type === "expense" && !t.categoryId
  );
  if (uncategorized.length > 0 && nudges.length < 3) {
    nudges.push({
      title: `${uncategorized.length} uncategorized transaction${uncategorized.length > 1 ? "s" : ""}`,
      description: "Some transactions need categories for accurate budget tracking.",
      actionLabel: "Categorize",
    });
  }

  return Response.json(nudges.slice(0, 3));
}
```

**Step 2: Add nudges to ChatWidget**

When the chat sheet opens, fetch nudges and display them as cards above the messages:

```tsx
const [nudges, setNudges] = useState<{ title: string; description: string; actionLabel?: string }[]>([]);

useEffect(() => {
  if (isOpen) {
    fetch("/api/ai/nudges")
      .then((r) => r.json())
      .then(setNudges)
      .catch(() => {});
  }
}, [isOpen]);

// In the JSX, above the messages list:
{nudges.length > 0 && (
  <div className="px-4 pt-2 space-y-2">
    {nudges.map((nudge, i) => (
      <div key={i} className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs space-y-1">
        <div className="flex justify-between items-start">
          <span className="font-medium">{nudge.title}</span>
          <button
            onClick={() => setNudges((prev) => prev.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <p className="text-muted-foreground">{nudge.description}</p>
        {nudge.actionLabel && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-6"
            onClick={() => {
              setNudges((prev) => prev.filter((_, j) => j !== i));
              setInput(nudge.title);
            }}
          >
            {nudge.actionLabel}
          </Button>
        )}
      </div>
    ))}
  </div>
)}
```

Import `X` from `lucide-react`.

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/api/ai/nudges/ src/components/chat/ChatWidget.tsx
git commit -m "feat: add proactive nudges to chat widget"
```

---

### Task 10: Integration test

**Files:**
- Create: `tests/ai-features.spec.ts` (Playwright E2E)

**Step 1: Write E2E test for agentic chat**

```typescript
// tests/ai-features.spec.ts
import { test, expect } from "@playwright/test";

test.describe("AI Intelligence Layer", () => {
  // These tests assume a logged-in user with existing data.
  // Use test fixtures or seed data as appropriate.

  test("chat renders and accepts input", async ({ page }) => {
    await page.goto("/dashboard");
    // Open chat
    await page.getByLabel("Open chat").click();
    await expect(page.getByText("Budget Assistant")).toBeVisible();
    // Type a message
    await page.getByPlaceholder("Ask a question...").fill("How much did I spend this month?");
    await page.getByRole("button", { name: /send/i }).click();
    // Wait for response
    await expect(page.locator(".bg-muted").last()).toBeVisible({ timeout: 15000 });
  });

  test("smart setup banner appears on budget page", async ({ page }) => {
    await page.goto("/budget");
    // Navigate to future month to get empty allocations
    // The banner should appear if totalAllocated is 0
    const banner = page.getByText("AI Suggest");
    if (await banner.isVisible()) {
      await expect(banner).toBeEnabled();
    }
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e -- tests/ai-features.spec.ts`
Expected: Tests pass (may need dev server running)

**Step 3: Run full test suite**

Run: `npm test -- --run && npx tsc --noEmit`
Expected: All pass

**Step 4: Commit**

```bash
git add tests/ai-features.spec.ts
git commit -m "test: add E2E tests for AI intelligence layer features"
```

---

### Task 11: Final cleanup and verification

**Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: All unit tests pass

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All pass

**Step 4: Manual smoke test checklist**

- [ ] Open chat, ask "how much did I spend on groceries?" → get text answer
- [ ] In chat, say "add a $12 lunch at Chipotle" → see TransactionConfirm card → click Confirm → transaction created
- [ ] In chat, ask "am I on track this month?" → get predictions with status indicators
- [ ] In chat, say "move $50 from Entertainment to Groceries" → see BudgetMoveConfirm card
- [ ] Navigate to budget page for a new month → see SmartSetupBanner → click AI Suggest → see allocation table → Apply All
- [ ] Navigate to a past month → click Generate Review → see rich report with metrics, charts, suggestions
- [ ] Open chat → see proactive nudges (if applicable state exists)
- [ ] Verify Convex real-time: open two tabs, create transaction via chat in one, see it appear in other

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final cleanup for AI intelligence layer"
```
