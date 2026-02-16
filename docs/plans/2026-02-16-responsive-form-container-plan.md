# Responsive Form Container Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** On mobile, form actions use bottom sheet drawers; on desktop, they use centered dialog modals.

**Architecture:** A shared `ResponsiveFormContainer` component detects viewport width via `useIsMobile` hook and renders either a Sheet (mobile) or Dialog (desktop). Existing form drawers swap their Sheet wrapper for this component; form content stays unchanged.

**Tech Stack:** React, Tailwind, shadcn Sheet + Dialog, `window.matchMedia`

**Design doc:** `docs/plans/2026-02-16-responsive-form-container-design.md`

---

### Task 1: Create `useIsMobile` hook

**Files:**
- Create: `src/hooks/useIsMobile.ts`

**Step 1: Create the hook**

```ts
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIsMobile.ts
git commit -m "feat: add useIsMobile hook"
```

---

### Task 2: Create `ResponsiveFormContainer` component

**Files:**
- Create: `src/components/ui/responsive-form-container.tsx`

**Step 1: Create the component**

This renders Sheet (bottom drawer) on mobile and Dialog (centered modal) on desktop. Both share the same `open`/`onOpenChange` API.

```tsx
"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ResponsiveFormContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  showCloseButton?: boolean;
  children: ReactNode;
}

export function ResponsiveFormContainer({
  open,
  onOpenChange,
  title,
  description,
  showCloseButton,
  children,
}: ResponsiveFormContainerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={showCloseButton}
          className="rounded-t-xl max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/responsive-form-container.tsx
git commit -m "feat: add ResponsiveFormContainer component"
```

---

### Task 3: Convert `AccountFormDrawer`

**Files:**
- Modify: `src/components/accounts/AccountFormDrawer.tsx`

**Step 1: Replace Sheet wrapper with ResponsiveFormContainer**

Replace the Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription imports and JSX with a single `ResponsiveFormContainer`. The form content (the `<div className="px-4 pb-6 space-y-4">` block) stays exactly the same.

Before (lines 72-127):
```tsx
return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="rounded-t-xl">
      <SheetHeader>
        <SheetTitle>{mode === "create" ? "Add Account" : "Edit Account"}</SheetTitle>
        <SheetDescription>
          {mode === "create" ? "Create a new account" : "Update account details"}
        </SheetDescription>
      </SheetHeader>

      <div className="px-4 pb-6 space-y-4">
        {/* ...form fields unchanged... */}
      </div>
    </SheetContent>
  </Sheet>
);
```

After:
```tsx
return (
  <ResponsiveFormContainer
    open={open}
    onOpenChange={onOpenChange}
    title={mode === "create" ? "Add Account" : "Edit Account"}
    description={mode === "create" ? "Create a new account" : "Update account details"}
  >
    <div className="px-4 pb-6 space-y-4">
      {/* ...form fields unchanged... */}
    </div>
  </ResponsiveFormContainer>
);
```

Update imports: remove Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription, add ResponsiveFormContainer.

**Step 2: Verify the app still renders**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/accounts/AccountFormDrawer.tsx
git commit -m "refactor: convert AccountFormDrawer to ResponsiveFormContainer"
```

---

### Task 4: Convert `TransactionFormDrawer`

**Files:**
- Modify: `src/components/transactions/TransactionFormDrawer.tsx`

**Step 1: Replace Sheet wrapper with ResponsiveFormContainer**

Same pattern as Task 3. Replace Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription with ResponsiveFormContainer.

Before (lines 137-269):
```tsx
return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="rounded-t-xl max-h-[90vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>...</SheetTitle>
        <SheetDescription>...</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-6 space-y-4">
        {/* ...form fields unchanged... */}
      </div>
    </SheetContent>
  </Sheet>
);
```

After:
```tsx
return (
  <ResponsiveFormContainer
    open={open}
    onOpenChange={onOpenChange}
    title={mode === "create" ? "Add Transaction" : "Edit Transaction"}
    description={mode === "create" ? "Record a new expense" : "Update transaction details"}
  >
    <div className="px-4 pb-6 space-y-4">
      {/* ...form fields unchanged... */}
    </div>
  </ResponsiveFormContainer>
);
```

Update imports: remove Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription, add ResponsiveFormContainer.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/transactions/TransactionFormDrawer.tsx
git commit -m "refactor: convert TransactionFormDrawer to ResponsiveFormContainer"
```

---

### Task 5: Convert `AssignmentDrawer`

**Files:**
- Modify: `src/components/budget/AssignmentDrawer.tsx`

**Step 1: Replace Sheet wrapper with ResponsiveFormContainer**

Before (lines 76-116):
```tsx
return (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl">
      <SheetHeader>
        <SheetTitle>{categoryName}</SheetTitle>
        <SheetDescription>Adjust budget assignment</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-6 space-y-6">
        {/* ...unchanged... */}
      </div>
    </SheetContent>
  </Sheet>
);
```

After:
```tsx
return (
  <ResponsiveFormContainer
    open={open}
    onOpenChange={onOpenChange}
    title={categoryName}
    description="Adjust budget assignment"
    showCloseButton={false}
  >
    <div className="px-4 pb-6 space-y-6">
      {/* ...unchanged... */}
    </div>
  </ResponsiveFormContainer>
);
```

Update imports: remove Sheet/SheetContent/SheetHeader/SheetTitle/SheetDescription, add ResponsiveFormContainer.

**Step 2: Commit**

```bash
git add src/components/budget/AssignmentDrawer.tsx
git commit -m "refactor: convert AssignmentDrawer to ResponsiveFormContainer"
```

---

### Task 6: Simplify `CategoryRow` desktop to use AssignmentDrawer

**Files:**
- Modify: `src/components/budget/CategoryRow.tsx`

**Step 1: Remove desktop inline editing, open AssignmentDrawer for both breakpoints**

Currently, desktop (lines 63-104) has inline input + slider editing. Mobile (lines 107-120) opens AssignmentDrawer on click. After this change:
- Desktop row shows name, assigned amount (clickable), spent, available — no inline slider, no inline input
- Clicking the assigned amount on desktop opens the AssignmentDrawer (which now renders as a Dialog on desktop via ResponsiveFormContainer)
- Mobile row stays exactly the same
- Remove `isEditing`, `inputValue`, `inputRef` state and `handleAmountClick`, `handleInputBlur`, `handleInputKeyDown` functions since they're no longer needed

After:
```tsx
"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { AssignmentDrawer } from "./AssignmentDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const available = assigned - spent;

  return (
    <>
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px] items-center gap-3 py-1.5 text-sm">
        <span className="truncate">{name}</span>

        <button
          onClick={() => setDrawerOpen(true)}
          className="text-right font-medium hover:underline cursor-pointer"
        >
          {formatCurrency(assigned, currency)}
        </button>

        <span className="text-right text-muted-foreground">
          {formatCurrency(spent, currency)}
        </span>

        <span className={cn("text-right", available < 0 ? "text-destructive" : "")}>
          {formatCurrency(available, currency)}
        </span>
      </div>

      {/* Mobile row */}
      <div className="grid md:hidden grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5 text-sm">
        <span className="truncate">{name}</span>

        <button
          onClick={() => setDrawerOpen(true)}
          className="text-right font-medium hover:underline cursor-pointer"
        >
          {formatCurrency(assigned, currency)}
        </button>

        <span className={cn("text-right", available < 0 ? "text-destructive" : "")}>
          {formatCurrency(available, currency)}
        </span>
      </div>

      <AssignmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categoryName={name}
        assigned={assigned}
        spent={spent}
        currency={currency}
        totalIncome={totalIncome}
        onAssignmentChange={(amount) => onAssignmentChange(categoryId, amount)}
        onAssignmentCommit={(amount) => onAssignmentCommit(categoryId, amount)}
      />
    </>
  );
}
```

Key changes:
- Remove imports: `useRef`, `Slider`, `Input`
- Remove state: `isEditing`, `inputValue`, `inputRef`
- Remove handlers: `handleAmountClick`, `handleInputBlur`, `handleInputKeyDown`
- Desktop row: remove inline input/slider, add click-to-open-drawer button (same as mobile)
- Desktop grid changes from `grid-cols-[1fr_100px_1fr_80px_80px]` to `grid-cols-[1fr_80px_80px_80px]` (no slider column)

**Step 2: Check the budget page header row matches new column layout**

Look at the budget page (`src/app/(app)/budget/page.tsx`) for the header row that labels the columns. Its desktop grid template must match the new `grid-cols-[1fr_80px_80px_80px]`. Update if needed.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/budget/CategoryRow.tsx
# also add budget page if header grid was updated
git commit -m "refactor: replace desktop inline editing with dialog in CategoryRow"
```

---

### Task 7: Update CLAUDE.md mobile UX pattern

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the "Mobile UX pattern" section**

Change from:
```
### Mobile UX pattern
On mobile (`<md`), use bottom sheet drawers (`Sheet` with `side="bottom"`) instead of inline editing, modals, or dropdowns for any interaction that requires input. Desktop keeps inline controls. This applies app-wide — budget assignment, transaction forms, filters, etc. See `AssignmentDrawer.tsx` as the reference implementation.
```

To:
```
### Mobile UX pattern
On mobile (`<md`), use bottom sheet drawers. On desktop (`>=md`), use centered dialog modals. The `ResponsiveFormContainer` component handles this automatically — it renders a `Sheet` on mobile and a `Dialog` on desktop. Use it for all multi-field form surfaces (account forms, transaction forms, budget assignment). Lightweight actions (dropdown menus, inline renames, filter bars) stay as-is. See `src/components/ui/responsive-form-container.tsx` for the implementation.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md mobile UX pattern for responsive forms"
```

---

### Task 8: Visual verification

**Step 1: Start the dev server and visually verify**

Run: `npm run dev` (and `npx convex dev` if not already running)

Check these pages at both mobile (< 768px) and desktop (>= 768px) widths:
- `/accounts` — Add Account and Edit Account: mobile = bottom drawer, desktop = dialog
- `/transactions` — Add Transaction and Edit Transaction: mobile = bottom drawer, desktop = dialog
- `/budget` — Click category assigned amount: mobile = bottom drawer, desktop = dialog
- `/budget` — Add Income dialog: unchanged (already a Dialog)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors
