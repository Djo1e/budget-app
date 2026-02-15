# Phase 4: AI Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add natural language transaction entry and a streaming AI chat widget with tool-calling for budget queries.

**Architecture:** Next.js API routes call Anthropic via Vercel AI SDK. NL parsing returns structured JSON; chat streams responses with 5 tools that query Convex via ConvexHttpClient server-side. Chat widget lives at layout level for persistence across navigation.

**Tech Stack:** `ai` (Vercel AI SDK), `@ai-sdk/anthropic`, ConvexHttpClient, Zod for validation, shadcn Sheet/Card for UI.

---

### Task 1: Install AI Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run: `npm install ai @ai-sdk/anthropic`

**Step 2: Set Anthropic API key as env var**

Run: `npx convex env set ANTHROPIC_API_KEY <key>`

Also add to `.env.local`:
```
ANTHROPIC_API_KEY=<key>
```

(The API routes run in Next.js, so they need `.env.local`. Convex env is not needed for this phase.)

**Step 3: Verify install**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Vercel AI SDK and Anthropic provider"
```

---

### Task 2: NL Transaction Parsing — Zod Schema + Unit Tests

**Files:**
- Create: `src/lib/ai/parse-transaction.ts`
- Create: `src/lib/__tests__/parse-transaction.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/__tests__/parse-transaction.test.ts
import { describe, it, expect } from "vitest";
import {
  parseTransactionResponseSchema,
  buildParsePrompt,
} from "../ai/parse-transaction";

describe("parseTransactionResponseSchema", () => {
  it("validates a correct response", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: 4.5,
      payeeName: "Starbucks",
      categoryName: "Coffee Shops",
      date: "2026-02-15",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional categoryName", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: 10,
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing amount", () => {
    const result = parseTransactionResponseSchema.safeParse({
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = parseTransactionResponseSchema.safeParse({
      amount: -5,
      payeeName: "Store",
      date: "2026-02-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("buildParsePrompt", () => {
  it("includes category and payee names", () => {
    const prompt = buildParsePrompt("coffee 4.50", {
      categories: [{ id: "cat1", name: "Coffee Shops" }],
      payees: [{ id: "p1", name: "Starbucks" }],
    });
    expect(prompt).toContain("Coffee Shops");
    expect(prompt).toContain("Starbucks");
    expect(prompt).toContain("coffee 4.50");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/__tests__/parse-transaction.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
// src/lib/ai/parse-transaction.ts
import { z } from "zod/v4";

export const parseTransactionResponseSchema = z.object({
  amount: z.number().positive(),
  payeeName: z.string().min(1),
  categoryName: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ParseTransactionResponse = z.infer<typeof parseTransactionResponseSchema>;

export function buildParsePrompt(
  text: string,
  context: {
    categories: { id: string; name: string }[];
    payees: { id: string; name: string }[];
  }
): string {
  const categoryNames = context.categories.map((c) => c.name).join(", ");
  const payeeNames = context.payees.map((p) => p.name).join(", ");

  return `Parse this transaction description into structured data.

Input: "${text}"

Available categories: ${categoryNames || "none"}
Known payees: ${payeeNames || "none"}

Return JSON with:
- amount: number (positive, the dollar/currency amount)
- payeeName: string (the merchant/payee — match to a known payee if close, otherwise use what's described)
- categoryName: string or omit (match to an available category if obvious)
- date: string in YYYY-MM-DD format (use today's date if not specified: ${new Date().toISOString().split("T")[0]})

Return ONLY valid JSON, no markdown fences or explanation.`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/__tests__/parse-transaction.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/ai/ src/lib/__tests__/parse-transaction.test.ts
git commit -m "feat: add NL transaction parse schema and prompt builder with tests"
```

---

### Task 3: NL Transaction Parsing — API Route

**Files:**
- Create: `src/app/api/ai/parse-transaction/route.ts`

**Step 1: Create the API route**

```ts
// src/app/api/ai/parse-transaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { isAuthenticated } from "@/lib/auth-server";
import {
  buildParsePrompt,
  parseTransactionResponseSchema,
} from "@/lib/ai/parse-transaction";

export async function POST(req: NextRequest) {
  const session = await isAuthenticated();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { text, categories, payees } = body as {
    text: string;
    categories: { id: string; name: string }[];
    payees: { id: string; name: string }[];
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const prompt = buildParsePrompt(text, { categories, payees });

  const { text: aiResponse } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt,
    maxTokens: 200,
  });

  const cleaned = aiResponse.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const parsed = parseTransactionResponseSchema.safeParse(JSON.parse(cleaned));

  if (!parsed.success) {
    return NextResponse.json({ error: "Failed to parse transaction" }, { status: 422 });
  }

  return NextResponse.json(parsed.data);
}
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/ai/parse-transaction/
git commit -m "feat: add NL transaction parse API route"
```

---

### Task 4: NL Quick-Add Input Component

**Files:**
- Create: `src/components/transactions/NLQuickAdd.tsx`

**Step 1: Create the component**

```tsx
// src/components/transactions/NLQuickAdd.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import type { ParseTransactionResponse } from "@/lib/ai/parse-transaction";

interface NLQuickAddProps {
  categories: { id: string; name: string }[];
  payees: { id: string; name: string }[];
  onParsed: (result: ParseTransactionResponse) => void;
  onError: () => void;
}

export function NLQuickAdd({ categories, payees, onParsed, onError }: NLQuickAddProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), categories, payees }),
      });

      if (!res.ok) {
        onError();
        return;
      }

      const data: ParseTransactionResponse = await res.json();
      onParsed(data);
      setText("");
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Try "coffee 4.50 at Starbucks"'
        className="pl-9 pr-9"
        disabled={loading}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </form>
  );
}
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/transactions/NLQuickAdd.tsx
git commit -m "feat: add NL quick-add input component"
```

---

### Task 5: Wire NL Quick-Add into Dashboard and Transactions Pages

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/transactions/page.tsx`

**Step 1: Add NL Quick-Add to Dashboard**

In `src/app/(app)/dashboard/page.tsx`:

1. Add imports at top:
```tsx
import { NLQuickAdd } from "@/components/transactions/NLQuickAdd";
import type { ParseTransactionResponse } from "@/lib/ai/parse-transaction";
import { toast } from "sonner";
```

2. Add handler after `handleQuickAdd`:
```tsx
function handleNLParsed(result: ParseTransactionResponse) {
  const allCategories = (categoryGroups ?? []).flatMap((g) => g.categories);
  const matchedCategory = result.categoryName
    ? allCategories.find(
        (c) => c.name.toLowerCase() === result.categoryName!.toLowerCase()
      )
    : undefined;

  setNlPrefill({
    amount: result.amount,
    date: result.date,
    payeeName: result.payeeName,
    categoryId: matchedCategory?._id,
  });
  setDrawerOpen(true);
}
```

3. Add state for NL prefill:
```tsx
const [nlPrefill, setNlPrefill] = useState<{
  amount: number;
  date: string;
  payeeName: string;
  categoryId?: Id<"categories">;
} | null>(null);
```

4. Add NL input below the Ready to Assign banner:
```tsx
<NLQuickAdd
  categories={(categoryGroups ?? []).flatMap((g) =>
    g.categories.map((c) => ({ id: c._id, name: c.name }))
  )}
  payees={(payees ?? []).map((p) => ({ id: p._id, name: p.name }))}
  onParsed={handleNLParsed}
  onError={() => toast.error("Couldn't parse that. Try the manual form.")}
/>
```

5. Pass `nlPrefill` as `initialValues` on the TransactionFormDrawer when it's set (create mode with prefill). Clear it when drawer closes. The TransactionFormDrawer already supports `initialValues` but only in edit mode — we need to handle this. Instead, modify the drawer's `onOpenChange` to clear prefill:
```tsx
onOpenChange={(open) => {
  setDrawerOpen(open);
  if (!open) setNlPrefill(null);
}}
```

And update the TransactionFormDrawer to accept an optional `prefill` prop (separate from edit `initialValues`).

**Step 2: Update TransactionFormDrawer to support prefill**

In `src/components/transactions/TransactionFormDrawer.tsx`, add a `prefill` prop:

```tsx
interface TransactionFormDrawerProps {
  // ... existing props
  prefill?: {
    amount?: number;
    date?: string;
    payeeName?: string;
    categoryId?: Id<"categories">;
  };
}
```

In the `useEffect` for `open`, add a branch for create mode with prefill:
```tsx
if (open) {
  if (mode === "edit" && initialValues) {
    // ... existing edit logic
  } else {
    setAmount(prefill?.amount?.toString() ?? "");
    setDate(prefill?.date ?? today);
    setPayeeName(prefill?.payeeName ?? "");
    setCategoryId(prefill?.categoryId ?? "");
    setAccountId(accounts[0]?._id ?? "");
    setNotes("");
  }
}
```

**Step 3: Wire NL Quick-Add into Transactions page**

Same pattern as Dashboard — add `NLQuickAdd` below the header, add `nlPrefill` state, pass to TransactionFormDrawer.

**Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/app/(app)/transactions/page.tsx src/components/transactions/TransactionFormDrawer.tsx
git commit -m "feat: wire NL quick-add into dashboard and transactions pages"
```

---

### Task 6: Chat API Route — Tool Definitions + Convex Helpers

**Files:**
- Create: `src/lib/ai/chat-tools.ts`
- Create: `src/lib/__tests__/chat-tools.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/__tests__/chat-tools.test.ts
import { describe, it, expect } from "vitest";
import { formatSpendingByCategory, formatAccountBalances } from "../ai/chat-tools";

describe("formatSpendingByCategory", () => {
  it("groups transactions by category and sums amounts", () => {
    const transactions = [
      { amount: 10, categoryId: "cat1", date: "2026-02-05", type: "expense" as const },
      { amount: 20, categoryId: "cat1", date: "2026-02-10", type: "expense" as const },
      { amount: 15, categoryId: "cat2", date: "2026-02-07", type: "expense" as const },
    ];
    const categoryMap = { cat1: "Groceries", cat2: "Coffee" };
    const result = formatSpendingByCategory(transactions, categoryMap, "2026-02");
    expect(result).toContain("Groceries");
    expect(result).toContain("30.00");
    expect(result).toContain("Coffee");
    expect(result).toContain("15.00");
  });

  it("filters to the specified month", () => {
    const transactions = [
      { amount: 10, categoryId: "cat1", date: "2026-02-05", type: "expense" as const },
      { amount: 99, categoryId: "cat1", date: "2026-01-05", type: "expense" as const },
    ];
    const categoryMap = { cat1: "Groceries" };
    const result = formatSpendingByCategory(transactions, categoryMap, "2026-02");
    expect(result).toContain("10.00");
    expect(result).not.toContain("99.00");
  });
});

describe("formatAccountBalances", () => {
  it("computes balances from initial minus expenses", () => {
    const accounts = [
      { name: "Checking", initialBalance: 1000, _id: "a1", type: "checking" as const },
    ];
    const transactions = [
      { amount: 50, accountId: "a1", type: "expense" as const },
      { amount: 30, accountId: "a1", type: "expense" as const },
    ];
    const result = formatAccountBalances(accounts, transactions);
    expect(result).toContain("Checking");
    expect(result).toContain("920.00");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/__tests__/chat-tools.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```ts
// src/lib/ai/chat-tools.ts

export function formatSpendingByCategory(
  transactions: { amount: number; categoryId?: string; date: string; type: string }[],
  categoryMap: Record<string, string>,
  month: string
): string {
  const filtered = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(month)
  );

  const totals: Record<string, number> = {};
  for (const t of filtered) {
    const name = t.categoryId ? (categoryMap[t.categoryId] ?? "Uncategorized") : "Uncategorized";
    totals[name] = (totals[name] ?? 0) + t.amount;
  }

  if (Object.keys(totals).length === 0) return "No spending found for this month.";

  const lines = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `- ${name}: $${amount.toFixed(2)}`);

  return `Spending for ${month}:\n${lines.join("\n")}`;
}

export function formatAccountBalances(
  accounts: { name: string; initialBalance: number; _id: string; type: string }[],
  transactions: { amount: number; accountId: string; type: string }[]
): string {
  if (accounts.length === 0) return "No accounts found.";

  const lines = accounts.map((acct) => {
    const spent = transactions
      .filter((t) => t.accountId === acct._id && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = acct.initialBalance - spent;
    return `- ${acct.name} (${acct.type}): $${balance.toFixed(2)}`;
  });

  return `Account balances:\n${lines.join("\n")}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/__tests__/chat-tools.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/ai/chat-tools.ts src/lib/__tests__/chat-tools.test.ts
git commit -m "feat: add chat tool formatting helpers with tests"
```

---

### Task 7: Chat API Route

**Files:**
- Create: `src/app/api/ai/chat/route.ts`

**Step 1: Create the streaming chat route**

```ts
// src/app/api/ai/chat/route.ts
import { streamText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import { ConvexHttpClient } from "convex/browser";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { formatSpendingByCategory, formatAccountBalances } from "@/lib/ai/chat-tools";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) {
    return new Response("Profile not found", { status: 404 });
  }

  const userId = userProfile._id;
  const currency = userProfile.currency;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are a helpful budget assistant. The user's currency is ${currency}. The current month is ${currentMonth}. Be concise and helpful. When reporting amounts, use the user's currency format. If you need data to answer a question, use the available tools.`,
    messages,
    maxTokens: 1000,
    tools: {
      get_spending_by_category: tool({
        description: "Get spending totals grouped by category for a given month",
        parameters: z.object({
          month: z.string().describe("Month in YYYY-MM format"),
        }),
        execute: async ({ month }) => {
          const transactions = await fetchAuthQuery(api.transactions.listByUserMonth, {
            userId,
            month,
          });
          const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
          const categoryMap: Record<string, string> = {};
          for (const g of groups) {
            for (const c of g.categories) {
              categoryMap[c._id] = c.name;
            }
          }
          return formatSpendingByCategory(transactions, categoryMap, month);
        },
      }),
      get_account_balances: tool({
        description: "Get all account balances",
        parameters: z.object({}),
        execute: async () => {
          const accounts = await fetchAuthQuery(api.accounts.listByUser, { userId });
          const transactions = await fetchAuthQuery(api.transactions.listByUser, { userId });
          return formatAccountBalances(accounts, transactions);
        },
      }),
      get_ready_to_assign: tool({
        description: "Get the ready-to-assign amount for a month",
        parameters: z.object({
          month: z.string().describe("Month in YYYY-MM format"),
        }),
        execute: async ({ month }) => {
          const income = await fetchAuthQuery(api.incomeEntries.listByUserMonth, {
            userId,
            month,
          });
          const allocations = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, {
            userId,
            month,
          });
          const totalIncome = income.reduce((s: number, e: { amount: number }) => s + e.amount, 0);
          const totalAllocated = allocations.reduce(
            (s: number, a: { assignedAmount: number }) => s + a.assignedAmount,
            0
          );
          return `Ready to assign for ${month}: $${(totalIncome - totalAllocated).toFixed(2)} (Income: $${totalIncome.toFixed(2)}, Allocated: $${totalAllocated.toFixed(2)})`;
        },
      }),
      get_recent_transactions: tool({
        description: "Get the most recent transactions",
        parameters: z.object({
          count: z.number().default(5).describe("Number of transactions to retrieve"),
        }),
        execute: async ({ count }) => {
          const transactions = await fetchAuthQuery(api.transactions.getRecent, {
            userId,
            limit: count,
          });
          const payees = await fetchAuthQuery(api.payees.listByUser, { userId });
          const payeeMap: Record<string, string> = {};
          for (const p of payees) payeeMap[p._id] = p.name;

          if (transactions.length === 0) return "No recent transactions.";
          const lines = transactions.map(
            (t: { date: string; payeeId: string; amount: number }) =>
              `- ${t.date}: ${payeeMap[t.payeeId] ?? "Unknown"} — $${t.amount.toFixed(2)}`
          );
          return `Recent transactions:\n${lines.join("\n")}`;
        },
      }),
      get_category_list: tool({
        description: "Get all budget categories organized by group",
        parameters: z.object({}),
        execute: async () => {
          const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
          if (groups.length === 0) return "No categories set up.";
          const lines = groups.map(
            (g: { name: string; categories: { name: string }[] }) =>
              `${g.name}: ${g.categories.map((c) => c.name).join(", ")}`
          );
          return lines.join("\n");
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors (may need minor type adjustments based on `fetchAuthQuery` return types)

**Step 3: Commit**

```bash
git add src/app/api/ai/chat/
git commit -m "feat: add streaming chat API route with budget tools"
```

---

### Task 8: Chat Widget UI Component

**Files:**
- Create: `src/components/chat/ChatWidget.tsx`

**Step 1: Create the chat widget**

```tsx
// src/components/chat/ChatWidget.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/chat",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[28rem] bg-background border rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">Budget Assistant</span>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-8">
                Ask me about your budget, spending, or accounts.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "text-sm rounded-lg px-3 py-2 max-w-[85%]",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {m.content}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="bg-muted text-sm rounded-lg px-3 py-2 max-w-[85%]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              className="flex-1 text-sm bg-transparent outline-none"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" variant="ghost" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/chat/
git commit -m "feat: add chat widget UI component with streaming"
```

---

### Task 9: Mount Chat Widget in App Layout

**Files:**
- Modify: `src/app/(app)/layout.tsx`

**Step 1: Add ChatWidget to layout**

In `src/app/(app)/layout.tsx`, import and render the ChatWidget inside the authenticated check:

```tsx
import { ChatWidget } from "@/components/chat/ChatWidget";

// In the return, after <AppShell>{children}</AppShell>:
return (
  <>
    <AppShell>{children}</AppShell>
    <ChatWidget />
  </>
);
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/(app)/layout.tsx
git commit -m "feat: mount chat widget in app layout"
```

---

### Task 10: E2E Tests

**Files:**
- Create: `tests/phase4-ai.spec.ts`

**Step 1: Write E2E tests**

These tests require a running app with a seeded user. They mock the AI API responses to avoid real API calls in CI.

```ts
// tests/phase4-ai.spec.ts
import { test, expect } from "@playwright/test";

// These tests assume a logged-in user with existing data from Phase 3 tests.
// The AI API routes are tested with the real endpoints, so ANTHROPIC_API_KEY must be set.

test.describe("NL Quick-Add", () => {
  test("parses natural language and pre-fills transaction form", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("text=Dashboard");

    // Find the NL quick-add input
    const nlInput = page.getByPlaceholder(/Try/);
    await nlInput.fill("coffee 4.50");
    await nlInput.press("Enter");

    // Wait for the form drawer to open with pre-filled amount
    await expect(page.locator('[id="tx-amount"]')).toBeVisible({ timeout: 15000 });
    const amountValue = await page.locator('[id="tx-amount"]').inputValue();
    expect(parseFloat(amountValue)).toBe(4.5);
  });
});

test.describe("Chat Widget", () => {
  test("opens chat and gets a response", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector("text=Dashboard");

    // Click the chat bubble
    await page.getByLabel("Open chat").click();
    await expect(page.getByText("Budget Assistant")).toBeVisible();

    // Type a question
    const chatInput = page.getByPlaceholder("Ask a question...");
    await chatInput.fill("What are my account balances?");
    await chatInput.press("Enter");

    // Wait for a response (the AI should use the get_account_balances tool)
    await expect(
      page.locator(".bg-muted").filter({ hasNotText: "" }).last()
    ).toBeVisible({ timeout: 30000 });
  });
});
```

**Step 2: Run E2E tests (requires dev server + ANTHROPIC_API_KEY)**

Run: `npm run test:e2e -- tests/phase4-ai.spec.ts`

Note: These tests hit real AI APIs, so they're slower and require a valid key. In CI, you may want to skip them or mock the API.

**Step 3: Commit**

```bash
git add tests/phase4-ai.spec.ts
git commit -m "test: add E2E tests for NL quick-add and chat widget"
```

---

### Task 11: Manual Smoke Test + Final Commit

**Step 1: Start dev servers**

Run (in two terminals):
```bash
npx convex dev
npm run dev
```

**Step 2: Manual verification checklist**

1. Go to `/dashboard` → see NL quick-add input with sparkle icon
2. Type "lunch 12.50" → press Enter → see loading spinner → form opens with $12.50
3. Submit the form → transaction appears in recent list
4. Go to `/transactions` → NL quick-add is also there
5. Click chat bubble (bottom-right) → panel opens
6. Type "how much did I spend this month?" → get a streaming response with spending breakdown
7. Type "what are my account balances?" → get account info
8. Close chat → reopen → messages still there (same session)
9. Refresh page → messages are gone (session memory only)
10. Mobile viewport: chat bubble is above bottom nav, NL input is responsive

**Step 3: Run full test suite**

Run: `npm test` (unit tests)
Run: `npx tsc --noEmit` (type check)

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "feat: Phase 4 — AI features (NL transaction entry + chat widget)"
```
