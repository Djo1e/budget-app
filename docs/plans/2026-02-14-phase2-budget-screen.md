# Phase 2: Budget Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully functional budget screen at `/budget` with slider+input assignment, real-time ready-to-assign tracking, income entry management, category/group CRUD, and month navigation.

**Architecture:** The budget page uses Convex reactive queries to fetch groups, categories, allocations, income entries, and transactions for a selected month. All math is computed client-side using existing `budget-math.ts` helpers. Mutations save assignments on slider commit / input blur. Month state is held in React state (not URL).

**Tech Stack:** Next.js App Router, Convex (queries/mutations), shadcn/ui (Slider, Input, Sheet, Collapsible, Dialog, DropdownMenu), Tailwind, Vitest, Playwright.

---

### Task 1: Add new shadcn components

We need `collapsible`, `dialog`, `dropdown-menu`, `tooltip`, and `accordion` components not yet installed.

**Files:**
- Create: `src/components/ui/collapsible.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/tooltip.tsx`

**Step 1: Install shadcn components**

Run: `npx shadcn@latest add collapsible dialog dropdown-menu tooltip --yes`

**Step 2: Verify installation**

Run: `ls src/components/ui/collapsible.tsx src/components/ui/dialog.tsx src/components/ui/dropdown-menu.tsx src/components/ui/tooltip.tsx`
Expected: All four files listed.

**Step 3: Commit**

```bash
git add src/components/ui/collapsible.tsx src/components/ui/dialog.tsx src/components/ui/dropdown-menu.tsx src/components/ui/tooltip.tsx
git commit -m "chore: add collapsible, dialog, dropdown-menu, tooltip shadcn components"
```

---

### Task 2: Add Convex mutations for category group CRUD

**Files:**
- Create: `convex/categoryGroups.ts`
- Modify: `convex/categories.ts` (add `updateCategory`)

**Step 1: Write unit tests for category group operations**

We can't easily unit test Convex functions in isolation without their test framework, so we'll verify via the E2E tests later and via `npx convex dev --once` for type/schema validation. Instead, write the mutations and validate with the Convex compiler.

**Step 2: Create `convex/categoryGroups.ts`**

```ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    name: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categoryGroups", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categoryGroups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("categoryGroups"),
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    // Find the Miscellaneous group to move orphaned categories
    const allGroups = await ctx.db
      .query("categoryGroups")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const miscGroup = allGroups.find((g) => g.name === "Miscellaneous");
    if (!miscGroup) throw new Error("Miscellaneous group not found");
    if (miscGroup._id === args.id) throw new Error("Cannot delete Miscellaneous group");

    // Move categories from deleted group to Miscellaneous
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();
    for (const cat of categories) {
      await ctx.db.patch(cat._id, { groupId: miscGroup._id });
    }

    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("categoryGroups"),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, { sortOrder: update.sortOrder });
    }
  },
});
```

**Step 3: Add `updateCategory` and `reorderCategories` to `convex/categories.ts`**

Append these two mutations to the existing file:

```ts
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const reorderCategories = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("categories"),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, { sortOrder: update.sortOrder });
    }
  },
});
```

**Step 4: Add `transactions.listByUserMonth` query**

Create `convex/transactions.ts`:

```ts
import { v } from "convex/values";
import { query } from "./_generated/server";

export const listByUserMonth = query({
  args: { userId: v.id("userProfiles"), month: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return all.filter((t) => t.date.startsWith(args.month));
  },
});
```

**Step 5: Add `incomeEntries.remove` mutation**

Append to `convex/incomeEntries.ts`:

```ts
export const remove = mutation({
  args: { id: v.id("incomeEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

**Step 6: Validate all Convex functions compile**

Run: `npx convex dev --once`
Expected: No errors, functions synced.

**Step 7: Commit**

```bash
git add convex/categoryGroups.ts convex/categories.ts convex/transactions.ts convex/incomeEntries.ts
git commit -m "feat: add Convex mutations for category group CRUD, category update, transactions query"
```

---

### Task 3: Write unit tests for month navigation helper

**Files:**
- Create: `src/lib/month-utils.ts`
- Create: `src/lib/__tests__/month-utils.test.ts`

**Step 1: Write failing tests**

Create `src/lib/__tests__/month-utils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getNextMonth, getPreviousMonth, formatMonthLabel } from "../month-utils";

describe("getNextMonth", () => {
  it("increments month", () => {
    expect(getNextMonth("2026-02")).toBe("2026-03");
  });

  it("wraps year", () => {
    expect(getNextMonth("2026-12")).toBe("2027-01");
  });
});

describe("getPreviousMonth", () => {
  it("decrements month", () => {
    expect(getPreviousMonth("2026-02")).toBe("2026-01");
  });

  it("wraps year", () => {
    expect(getPreviousMonth("2026-01")).toBe("2025-12");
  });
});

describe("formatMonthLabel", () => {
  it("formats YYYY-MM to readable label", () => {
    expect(formatMonthLabel("2026-02")).toBe("February 2026");
  });

  it("formats January", () => {
    expect(formatMonthLabel("2026-01")).toBe("January 2026");
  });

  it("formats December", () => {
    expect(formatMonthLabel("2025-12")).toBe("December 2025");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/__tests__/month-utils.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement `src/lib/month-utils.ts`**

```ts
export function getNextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (m === 12) return `${year + 1}-01`;
  return `${year}-${String(m + 1).padStart(2, "0")}`;
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  if (m === 1) return `${year - 1}-12`;
  return `${year}-${String(m - 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/month-utils.test.ts`
Expected: All 6 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/month-utils.ts src/lib/__tests__/month-utils.test.ts
git commit -m "feat: add month navigation utilities with tests"
```

---

### Task 4: Build MonthSelector component

**Files:**
- Create: `src/components/budget/MonthSelector.tsx`

**Step 1: Create MonthSelector**

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel, getNextMonth, getPreviousMonth } from "@/lib/month-utils";

interface MonthSelectorProps {
  month: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ month, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMonthChange(getPreviousMonth(month))}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center font-medium">
        {formatMonthLabel(month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMonthChange(getNextMonth(month))}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/budget/MonthSelector.tsx
git commit -m "feat: add MonthSelector component"
```

---

### Task 5: Build ReadyToAssignBanner component

**Files:**
- Create: `src/components/budget/ReadyToAssignBanner.tsx`

**Step 1: Create the banner**

```tsx
"use client";

import { formatCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface ReadyToAssignBannerProps {
  amount: number;
  currency: string;
}

export function ReadyToAssignBanner({ amount, currency }: ReadyToAssignBannerProps) {
  const isNegative = amount < 0;
  const isZero = amount === 0;

  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-center",
        isNegative && "bg-destructive/10 text-destructive",
        isZero && "bg-muted text-muted-foreground",
        !isNegative && !isZero && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
      )}
    >
      <p className="text-sm font-medium">Ready to Assign</p>
      <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
      {isNegative && (
        <p className="text-sm mt-1">You have assigned more than your income this month.</p>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/budget/ReadyToAssignBanner.tsx
git commit -m "feat: add ReadyToAssignBanner component"
```

---

### Task 6: Build CategoryRow component (slider + inline input)

**Files:**
- Create: `src/components/budget/CategoryRow.tsx`

**Step 1: Create CategoryRow with dual slider+input**

```tsx
"use client";

import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currencies";

interface CategoryRowProps {
  categoryId: string;
  name: string;
  assigned: number;
  spent: number;
  totalIncome: number;
  currency: string;
  onAssignmentChange: (categoryId: string, amount: number) => void;
  onAssignmentCommit: (categoryId: string, amount: number) => void;
}

export function CategoryRow({
  categoryId,
  name,
  assigned,
  spent,
  totalIncome,
  currency,
  onAssignmentChange,
  onAssignmentCommit,
}: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const available = assigned - spent;

  function handleAmountClick() {
    setInputValue(assigned.toFixed(2));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleInputBlur() {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const rounded = Math.round(parsed * 100) / 100;
      onAssignmentChange(categoryId, rounded);
      onAssignmentCommit(categoryId, rounded);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_100px_1fr_80px_80px] items-center gap-3 py-1.5 text-sm">
      <span className="truncate">{name}</span>

      {isEditing ? (
        <Input
          ref={inputRef}
          type="number"
          min={0}
          step={0.01}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="h-7 text-right text-sm"
        />
      ) : (
        <button
          onClick={handleAmountClick}
          className="text-right font-medium hover:underline cursor-pointer"
        >
          {formatCurrency(assigned, currency)}
        </button>
      )}

      <Slider
        value={[assigned]}
        max={Math.max(totalIncome, assigned + 100)}
        step={1}
        onValueChange={([v]) => onAssignmentChange(categoryId, v)}
        onValueCommit={([v]) => onAssignmentCommit(categoryId, v)}
        className="w-full"
      />

      <span className="text-right text-muted-foreground">
        {formatCurrency(spent, currency)}
      </span>

      <span className={cn("text-right", available < 0 ? "text-destructive" : "")}>
        {formatCurrency(available, currency)}
      </span>
    </div>
  );
}
```

Note: We need to import `cn` — add `import { cn } from "@/lib/utils";` at the top.

**Step 2: Commit**

```bash
git add src/components/budget/CategoryRow.tsx
git commit -m "feat: add CategoryRow with slider and inline input"
```

---

### Task 7: Build CategoryGroupSection component

**Files:**
- Create: `src/components/budget/CategoryGroupSection.tsx`

**Step 1: Create CategoryGroupSection with collapsible + CRUD**

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CategoryRow } from "./CategoryRow";
import { formatCurrency } from "@/lib/currencies";
import type { Id } from "../../../convex/_generated/dataModel";

interface Category {
  _id: Id<"categories">;
  name: string;
  sortOrder: number;
}

interface CategoryGroupSectionProps {
  groupId: Id<"categoryGroups">;
  groupName: string;
  categories: Category[];
  allocations: Record<string, number>;
  activity: Record<string, number>;
  totalIncome: number;
  currency: string;
  isDeletable: boolean;
  onAssignmentChange: (categoryId: string, amount: number) => void;
  onAssignmentCommit: (categoryId: string, amount: number) => void;
  onAddCategory: (groupId: Id<"categoryGroups">, name: string) => void;
  onRenameGroup: (groupId: Id<"categoryGroups">, name: string) => void;
  onDeleteGroup: (groupId: Id<"categoryGroups">) => void;
  onRenameCategory: (categoryId: Id<"categories">, name: string) => void;
  onDeleteCategory: (categoryId: Id<"categories">) => void;
}

export function CategoryGroupSection({
  groupId,
  groupName,
  categories,
  allocations,
  activity,
  totalIncome,
  currency,
  isDeletable,
  onAssignmentChange,
  onAssignmentCommit,
  onAddCategory,
  onRenameGroup,
  onDeleteGroup,
  onRenameCategory,
  onDeleteCategory,
}: CategoryGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupName);

  const groupTotal = categories.reduce(
    (sum, cat) => sum + (allocations[cat._id] ?? 0),
    0
  );

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      onAddCategory(groupId, trimmed);
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  }

  function handleRenameGroup() {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== groupName) {
      onRenameGroup(groupId, trimmed);
    }
    setIsEditingName(false);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-2">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 font-semibold text-sm hover:text-foreground">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRenameGroup}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-40 text-sm font-semibold"
                autoFocus
              />
            ) : (
              <span>{groupName}</span>
            )}
          </button>
        </CollapsibleTrigger>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatCurrency(groupTotal, currency)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingCategory(true)}>
                Add Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsEditingName(true); setEditedName(groupName); }}>
                Rename Group
              </DropdownMenuItem>
              {isDeletable && (
                <DropdownMenuItem
                  onClick={() => onDeleteGroup(groupId)}
                  className="text-destructive"
                >
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_100px_1fr_80px_80px] gap-3 text-xs text-muted-foreground px-0 pb-1 border-b mb-1">
          <span>Category</span>
          <span className="text-right">Assigned</span>
          <span></span>
          <span className="text-right">Spent</span>
          <span className="text-right">Available</span>
        </div>

        {categories.map((cat) => (
          <CategoryRow
            key={cat._id}
            categoryId={cat._id}
            name={cat.name}
            assigned={allocations[cat._id] ?? 0}
            spent={activity[cat._id] ?? 0}
            totalIncome={totalIncome}
            currency={currency}
            onAssignmentChange={onAssignmentChange}
            onAssignmentCommit={onAssignmentCommit}
          />
        ))}

        {isAddingCategory && (
          <div className="flex items-center gap-2 py-1.5">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") setIsAddingCategory(false);
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/budget/CategoryGroupSection.tsx
git commit -m "feat: add CategoryGroupSection with collapsible CRUD"
```

---

### Task 8: Build AddIncomeDialog component

**Files:**
- Create: `src/components/budget/AddIncomeDialog.tsx`

**Step 1: Create AddIncomeDialog**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface AddIncomeDialogProps {
  onAdd: (amount: number, label: string, date: string) => void;
  month: string;
}

export function AddIncomeDialog({ onAdd, month }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    onAdd(parsed, label, date);
    setAmount("");
    setLabel("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Income</DialogTitle>
        </DialogHeader>
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
          <div className="space-y-2">
            <Label htmlFor="income-label">Label (optional)</Label>
            <Input
              id="income-label"
              placeholder="e.g. Paycheck, Freelance"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
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
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/budget/AddIncomeDialog.tsx
git commit -m "feat: add AddIncomeDialog component"
```

---

### Task 9: Build the BudgetPage (wire everything together)

**Files:**
- Modify: `src/app/(app)/budget/page.tsx`

**Step 1: Replace the placeholder budget page**

Replace the entire contents of `src/app/(app)/budget/page.tsx` with:

```tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getCurrentMonth, formatCurrency } from "@/lib/currencies";
import { calculateReadyToAssign, calculateCategorySpent } from "@/lib/budget-math";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { MonthSelector } from "@/components/budget/MonthSelector";
import { ReadyToAssignBanner } from "@/components/budget/ReadyToAssignBanner";
import { CategoryGroupSection } from "@/components/budget/CategoryGroupSection";
import { AddIncomeDialog } from "@/components/budget/AddIncomeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function BudgetPage() {
  const { userProfile } = useAuthGuard();
  const [month, setMonth] = useState(getCurrentMonth);

  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";

  const groups = useQuery(
    api.categories.listGroupsByUser,
    userId ? { userId } : "skip"
  );
  const incomeEntries = useQuery(
    api.incomeEntries.listByUserMonth,
    userId ? { userId, month } : "skip"
  );
  const allocations = useQuery(
    api.budgetAllocations.listByUserMonth,
    userId ? { userId, month } : "skip"
  );
  const transactions = useQuery(
    api.transactions.listByUserMonth,
    userId ? { userId, month } : "skip"
  );

  const upsertAllocation = useMutation(api.budgetAllocations.upsert);
  const createIncome = useMutation(api.incomeEntries.create);
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const removeCategory = useMutation(api.categories.removeCategory);
  const createGroup = useMutation(api.categoryGroups.create);
  const updateGroup = useMutation(api.categoryGroups.update);
  const removeGroup = useMutation(api.categoryGroups.remove);

  // Local assignment state for responsive slider updates
  const [localAssignments, setLocalAssignments] = useState<Record<string, number>>({});

  // Reset local assignments when month changes
  const [prevMonth, setPrevMonth] = useState(month);
  if (month !== prevMonth) {
    setLocalAssignments({});
    setPrevMonth(month);
  }

  // Build allocation map: categoryId -> assigned amount
  const allocationMap = useMemo(() => {
    const map: Record<string, number> = {};
    (allocations ?? []).forEach((a) => {
      map[a.categoryId] = a.assignedAmount;
    });
    return { ...map, ...localAssignments };
  }, [allocations, localAssignments]);

  // Build activity map: categoryId -> spent amount
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!groups || !transactions) return map;
    for (const group of groups) {
      for (const cat of group.categories) {
        map[cat._id] = calculateCategorySpent(transactions, cat._id, month);
      }
    }
    return map;
  }, [groups, transactions, month]);

  // Ready to assign
  const totalIncome = useMemo(
    () => (incomeEntries ?? []).reduce((sum, e) => sum + e.amount, 0),
    [incomeEntries]
  );
  const totalAssigned = useMemo(
    () => Object.values(allocationMap).reduce((sum, v) => sum + v, 0),
    [allocationMap]
  );
  const readyToAssign = totalIncome - totalAssigned;

  const handleAssignmentChange = useCallback((categoryId: string, amount: number) => {
    setLocalAssignments((prev) => ({ ...prev, [categoryId]: amount }));
  }, []);

  const handleAssignmentCommit = useCallback(
    (categoryId: string, amount: number) => {
      if (!userId) return;
      upsertAllocation({
        userId,
        month,
        categoryId: categoryId as Id<"categories">,
        assignedAmount: amount,
      });
    },
    [userId, month, upsertAllocation]
  );

  function handleAddIncome(amount: number, label: string, date: string) {
    if (!userId) return;
    createIncome({
      userId,
      month,
      amount,
      label: label || undefined,
      date,
    });
  }

  function handleAddCategory(groupId: Id<"categoryGroups">, name: string) {
    if (!userId || !groups) return;
    const group = groups.find((g) => g._id === groupId);
    const maxSort = group
      ? Math.max(0, ...group.categories.map((c) => c.sortOrder))
      : 0;
    addCategory({
      userId,
      groupId,
      name,
      sortOrder: maxSort + 1,
    });
  }

  function handleRenameGroup(groupId: Id<"categoryGroups">, name: string) {
    updateGroup({ id: groupId, name });
  }

  function handleDeleteGroup(groupId: Id<"categoryGroups">) {
    if (!userId) return;
    removeGroup({ id: groupId, userId });
  }

  function handleRenameCategory(categoryId: Id<"categories">, name: string) {
    updateCategory({ id: categoryId, name });
  }

  function handleDeleteCategory(categoryId: Id<"categories">) {
    removeCategory({ id: categoryId });
  }

  // State for adding new group
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  function handleAddGroup() {
    if (!userId || !groups) return;
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const maxSort = Math.max(0, ...groups.map((g) => g.sortOrder));
    createGroup({ userId, name: trimmed, sortOrder: maxSort + 1 });
    setNewGroupName("");
    setIsAddingGroup(false);
  }

  if (!userId || !groups || incomeEntries === undefined || allocations === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MonthSelector month={month} onMonthChange={setMonth} />
        <AddIncomeDialog onAdd={handleAddIncome} month={month} />
      </div>

      <ReadyToAssignBanner amount={readyToAssign} currency={currency} />

      <div className="space-y-2">
        {groups.map((group) => (
          <CategoryGroupSection
            key={group._id}
            groupId={group._id}
            groupName={group.name}
            categories={group.categories}
            allocations={allocationMap}
            activity={activityMap}
            totalIncome={totalIncome}
            currency={currency}
            isDeletable={group.name !== "Miscellaneous"}
            onAssignmentChange={handleAssignmentChange}
            onAssignmentCommit={handleAssignmentCommit}
            onAddCategory={handleAddCategory}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ))}
      </div>

      {isAddingGroup ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGroup();
              if (e.key === "Escape") setIsAddingGroup(false);
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAddGroup}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingGroup(false)}>Cancel</Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingGroup(true)}
          className="text-muted-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category Group
        </Button>
      )}
    </div>
  );
}
```

**Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/(app)/budget/page.tsx
git commit -m "feat: build budget page with assignment, income, category CRUD, month navigation"
```

---

### Task 10: Write E2E tests for budget page

**Files:**
- Create: `e2e/budget.spec.ts`

**Step 1: Write budget E2E tests**

```ts
import { test, expect } from "@playwright/test";

// Helper: create a fresh user and complete onboarding
async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `budget-test-${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.fill('input[name="name"]', "Budget Tester");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "TestPassword123!");
  await page.click('button[type="submit"]');

  // Onboarding
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  // Step 1: Currency — just proceed with USD
  await page.click('button:has-text("Next")');

  // Step 2: Accounts — add a checking account
  await page.fill('input[name="accountName"]', "Checking");
  await page.click('button:has-text("Add")');
  await expect(page.getByText("Checking")).toBeVisible();
  await page.click('button:has-text("Next")');

  // Step 3: Income — add $5000
  await page.fill('input[name="income"]', "5000");
  await page.click('button:has-text("Next")');

  // Step 4: Categories — use defaults
  await expect(page.getByText("Your categories")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Next")');

  // Step 5: Assign — skip assignment, just finish
  await expect(page.getByText("Assign your money")).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Finish")');

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Budget page", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
    await page.goto("/budget");
    await expect(page.getByText("Ready to Assign")).toBeVisible({ timeout: 10000 });
  });

  test("shows ready to assign with full income", async ({ page }) => {
    // Should show $5,000 ready to assign (nothing assigned during onboarding)
    await expect(page.getByText("$5,000.00")).toBeVisible();
  });

  test("assigning money decreases ready to assign", async ({ page }) => {
    // Click on the first $0.00 assigned amount to edit it
    const firstAssigned = page.locator('button:has-text("$0.00")').first();
    await firstAssigned.click();

    // Type 1000 in the input
    const input = page.locator('input[type="number"]').first();
    await input.fill("1000");
    await input.blur();

    // Ready to assign should decrease
    await expect(page.getByText("$4,000.00")).toBeVisible({ timeout: 5000 });
  });

  test("over-assigning shows warning", async ({ page }) => {
    // Assign more than income to a single category
    const firstAssigned = page.locator('button:has-text("$0.00")').first();
    await firstAssigned.click();

    const input = page.locator('input[type="number"]').first();
    await input.fill("6000");
    await input.blur();

    // Should show negative/warning state
    await expect(page.getByText("You have assigned more than your income")).toBeVisible({
      timeout: 5000,
    });
  });

  test("add income mid-month increases ready to assign", async ({ page }) => {
    // Click Add Income button
    await page.click('button:has-text("Add Income")');

    // Fill in income dialog
    await page.fill('#income-amount', "2000");
    await page.fill('#income-label', "Freelance");
    await page.click('button[type="submit"]:has-text("Add")');

    // Ready to assign should now be $7,000
    await expect(page.getByText("$7,000.00")).toBeVisible({ timeout: 5000 });
  });

  test("month navigation shows fresh budget", async ({ page }) => {
    // Navigate to next month
    await page.click('[aria-label="Next month"]');

    // Should show $0.00 ready to assign (no income in next month)
    await expect(page.getByText("$0.00")).toBeVisible({ timeout: 5000 });

    // Navigate back
    await page.click('[aria-label="Previous month"]');

    // Should show original amount again
    await expect(page.getByText("$5,000.00")).toBeVisible({ timeout: 5000 });
  });
});
```

**Step 2: Run E2E tests (requires both dev servers running)**

Run: `npm run test:e2e -- --grep "Budget page"`
Expected: All 5 tests pass. (If auth/onboarding takes time, the beforeEach helper handles the full flow.)

**Step 3: Commit**

```bash
git add e2e/budget.spec.ts
git commit -m "test: add E2E tests for budget page assignment, income, and month navigation"
```

---

### Task 11: Manual smoke test and fix

**Step 1: Start dev servers**

Run (in separate terminals):
- `npx convex dev`
- `npm run dev`

**Step 2: Manual verification checklist**

Open `http://localhost:3000/budget` in browser (must be logged in with completed onboarding):

- [ ] Month selector shows current month, arrows work
- [ ] Ready-to-assign banner shows correct amount and color
- [ ] Category groups are collapsible
- [ ] Slider changes update the assigned amount and ready-to-assign in real-time
- [ ] Clicking assigned amount opens inline input, typing and blurring saves
- [ ] "Add Income" dialog opens, accepts amount/label/date, creates income
- [ ] Adding a category group works (button at bottom)
- [ ] Adding a category within a group works (dropdown menu → "Add Category")
- [ ] Deleting a category group moves categories to Miscellaneous
- [ ] Mobile viewport: layout is usable, sliders are touch-friendly

**Step 3: Fix any issues found, commit fixes**

---

### Task 12: Final TypeScript check and test run

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 2: Run all unit tests**

Run: `npm test`
Expected: All tests pass.

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (both existing onboarding + new budget tests).

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: Phase 2 cleanup and fixes"
```
