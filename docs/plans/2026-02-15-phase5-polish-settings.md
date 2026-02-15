# Phase 5: Polish + Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete MVP with settings page, bold landing page, mobile swipe actions on transactions, and error handling polish.

**Architecture:** Settings page uses existing Convex user profile pattern with a new `updateName` mutation. Landing page is a server component at `/` that checks auth and either shows hero or redirects. Swipe actions use raw touch events + CSS transforms on mobile transaction rows. Error handling pass adds toast notifications to all mutation error paths.

**Tech Stack:** Next.js App Router, Convex, Tailwind, shadcn/ui, Playwright, Better Auth

---

### Task 1: Add `updateName` Mutation to Convex

**Files:**
- Modify: `convex/users.ts` (add mutation after existing `updateCurrency` around line 84)

**Step 1: Add the `updateName` mutation**

Add after the `updateCurrency` mutation in `convex/users.ts`:

```ts
export const updateName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_betterAuthUserId", (q) =>
        q.eq("betterAuthUserId", identity.subject)
      )
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, { name: args.name });
  },
});
```

**Step 2: Verify Convex compiles**

Run: `npx convex dev --once`
Expected: Success, no errors

**Step 3: Commit**

```bash
git add convex/users.ts
git commit -m "feat: add updateName mutation for settings page"
```

---

### Task 2: Build Settings Page

**Files:**
- Modify: `src/app/(app)/settings/page.tsx` (replace placeholder entirely)

**Step 1: Implement the settings page**

Replace the entire contents of `src/app/(app)/settings/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Wallet, LogOut, Check, Pencil, X } from "lucide-react";

export default function SettingsPage() {
  const { isLoading, userProfile } = useAuthGuard();
  const updateName = useMutation(api.users.updateName);
  const router = useRouter();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  if (isLoading || !userProfile) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleEditName = () => {
    setNameValue(userProfile.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    try {
      await updateName({ name: trimmed });
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="h-8 w-48"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{userProfile.name}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditName}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{userProfile.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Currency</span>
            <Badge variant="secondary">{userProfile.currency}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/accounts"
            className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors"
          >
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Accounts</span>
          </Link>
          <Link
            href="/budget"
            className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors"
          >
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Categories</span>
          </Link>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/\(app\)/settings/page.tsx
git commit -m "feat: implement settings page with profile, manage links, sign out"
```

---

### Task 3: Build Landing Page

**Files:**
- Modify: `src/app/page.tsx` (replace redirect with landing page)

This task should use the `frontend-design` skill for high visual quality. The page should be bold and distinctive.

**Step 1: Replace root page with landing page**

Replace `src/app/page.tsx` with a client component that checks auth state. If authenticated, redirect to `/dashboard`. If not, show a bold hero landing page.

Requirements for the landing page:
- `"use client"` component using `useConvexAuth()` to check auth
- While loading auth: show nothing or a minimal spinner
- If authenticated: `router.replace("/dashboard")`
- If unauthenticated: bold hero section with:
  - Strong headline about zero-based budgeting (something like "Every dollar gets a job.")
  - 2-3 short value prop bullets
  - Prominent "Get Started" button → `/signup`
  - Subtle "Log In" link → `/login`
  - Bold, high-contrast design. Not generic. Use large type, strong colors, generous spacing.
- No external images or assets needed. Typography-driven design.

Use the `@frontend-design` skill to generate this component with high design quality. The design should feel confident and modern — not like a default template.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add bold landing page for unauthenticated users"
```

---

### Task 4: Transaction Swipe Actions (Mobile)

**Files:**
- Create: `src/components/transactions/SwipeableRow.tsx`
- Modify: `src/components/transactions/TransactionRow.tsx` (wrap mobile layout in SwipeableRow)
- Modify: `src/app/(app)/transactions/page.tsx` (pass `onDelete` prop to TransactionRow)

**Step 1: Create the SwipeableRow component**

Create `src/components/transactions/SwipeableRow.tsx` — a wrapper component that adds swipe-left gesture to reveal action buttons on mobile.

Implementation approach:
- Track touch start/move/end via `onTouchStart`, `onTouchMove`, `onTouchEnd`
- Use `translateX` CSS transform to slide the row content left
- Reveal edit (blue) and delete (red) action buttons behind the row
- Threshold: if swiped > 80px, snap open; otherwise snap back
- Tapping outside or tapping an action closes the swipe
- Only renders swipe behavior on mobile — on desktop, children render normally

```tsx
"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);

  const THRESHOLD = 80;
  const OPEN_WIDTH = 128; // 2 buttons * 64px

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // If vertical scroll is dominant, don't swipe
    if (!isSwiping.current && Math.abs(dy) > Math.abs(dx)) return;
    isSwiping.current = true;

    if (isOpen) {
      // Already open — allow swiping back right
      const newOffset = Math.min(0, Math.max(-OPEN_WIDTH, -OPEN_WIDTH + dx));
      setOffsetX(newOffset);
    } else {
      // Closed — only allow swiping left
      const newOffset = Math.min(0, Math.max(-OPEN_WIDTH, dx));
      setOffsetX(newOffset);
    }
  }, [isOpen]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) > THRESHOLD) {
      setOffsetX(-OPEN_WIDTH);
      setIsOpen(true);
    } else {
      setOffsetX(0);
      setIsOpen(false);
    }
  }, [offsetX]);

  const close = useCallback(() => {
    setOffsetX(0);
    setIsOpen(false);
  }, []);

  const handleEdit = useCallback(() => {
    close();
    onEdit();
  }, [close, onEdit]);

  const handleDelete = useCallback(() => {
    close();
    onDelete();
  }, [close, onDelete]);

  return (
    <div className="md:hidden relative overflow-hidden">
      {/* Action buttons behind the row */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          className="w-16 flex items-center justify-center bg-blue-500 text-white"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          className="w-16 flex items-center justify-center bg-destructive text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Slideable content */}
      <div
        className="relative bg-background transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Modify TransactionRow to use SwipeableRow on mobile**

In `src/components/transactions/TransactionRow.tsx`:

- Add `onDelete` to props: `onDelete: (id: Id<"transactions">) => void`
- Import `SwipeableRow`
- Wrap the mobile `<div>` (the `md:hidden` one) in `<SwipeableRow>`:
  - Remove `md:hidden` from the inner div (SwipeableRow already has it)
  - Pass `onEdit={() => onEdit(transaction._id)}` and `onDelete={() => onDelete(transaction._id)}` to SwipeableRow
  - Keep the `onClick` on the inner div for tap-to-edit

**Step 3: Update transactions page to pass `onDelete`**

In `src/app/(app)/transactions/page.tsx`, pass `onDelete={handleDelete}` to each `<TransactionRow>`. The `handleDelete` function already exists (line 147). Add a confirmation step:

```tsx
const handleSwipeDelete = useCallback(
  async (id: Id<"transactions">) => {
    if (window.confirm("Delete this transaction?")) {
      await removeTx({ id });
      toast.success("Transaction deleted");
    }
  },
  [removeTx]
);
```

Pass `onDelete={handleSwipeDelete}` to `<TransactionRow>`.

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/transactions/SwipeableRow.tsx src/components/transactions/TransactionRow.tsx src/app/\(app\)/transactions/page.tsx
git commit -m "feat: add swipe-to-edit and swipe-to-delete on mobile transaction rows"
```

---

### Task 5: Error Handling Polish Pass

**Files:**
- Modify: `src/app/(app)/budget/page.tsx` — add try/catch + toast.error to all mutations
- Modify: `src/app/(app)/accounts/page.tsx` — add try/catch + toast.error to all mutations
- Modify: `src/app/(app)/transactions/page.tsx` — add try/catch + toast.error to remaining mutations
- Modify: `src/app/(app)/dashboard/page.tsx` — add try/catch + toast.error to NL parse and transaction create
- Modify: `src/app/(app)/settings/page.tsx` — already handled in Task 2

**Step 1: Audit and add error toasts**

For each page, find all `await` calls on Convex mutations. Wrap each in try/catch if not already wrapped. Add `toast.error("Failed to [action]")` in each catch block. Also add `toast.success("[Action] completed")` for destructive actions (delete) where feedback is important.

Pattern to apply:
```tsx
try {
  await someMutation({ ...args });
  // optional: toast.success("Done") for destructive/important actions
} catch {
  toast.error("Failed to [description]");
}
```

Make sure `import { toast } from "sonner"` is present in each file.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/\(app\)/budget/page.tsx src/app/\(app\)/accounts/page.tsx src/app/\(app\)/transactions/page.tsx src/app/\(app\)/dashboard/page.tsx
git commit -m "fix: add error toast notifications to all mutation paths"
```

---

### Task 6: E2E Tests

**Files:**
- Create: `e2e/settings.spec.ts`
- Create: `e2e/landing.spec.ts`

**Step 1: Write settings E2E test**

Create `e2e/settings.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// Reuse the signup helper pattern from other test files
async function signupAndOnboard(page: import("@playwright/test").Page) {
  const email = `settings-test-${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.fill("#name", "Settings Tester");
  await page.fill("#email", email);
  await page.fill("#password", "TestPassword123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

  // Step 1: Currency
  await page.click("text=Continue");
  // Step 2: Accounts
  await page.click("text=Continue");
  // Step 3: Income
  await page.fill('input[name="amount"]', "5000");
  await page.click("text=Continue");
  // Step 4: Categories
  await page.click("text=Continue");
  // Step 5: Assignment
  await page.click("text=Finish");

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signupAndOnboard(page);
    await page.goto("/settings");
    await expect(page.getByText("Settings")).toBeVisible({ timeout: 5000 });
  });

  test("displays profile information", async ({ page }) => {
    await expect(page.getByText("Settings Tester")).toBeVisible();
    await expect(page.getByText("USD")).toBeVisible();
  });

  test("can edit name", async ({ page }) => {
    await page.click('[data-testid="edit-name"]');
    const input = page.locator("input").first();
    await input.fill("New Name");
    await input.press("Enter");
    await expect(page.getByText("Name updated")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("New Name")).toBeVisible();
  });

  test("manage accounts link navigates to accounts page", async ({ page }) => {
    await page.click("text=Manage Accounts");
    await expect(page).toHaveURL(/\/accounts/);
  });

  test("manage categories link navigates to budget page", async ({ page }) => {
    await page.click("text=Manage Categories");
    await expect(page).toHaveURL(/\/budget/);
  });
});
```

Note: The exact selectors for the onboarding wizard should match the actual onboarding flow. Check `e2e/dashboard.spec.ts` for the exact `signupAndOnboard` helper and replicate it. Consider extracting the helper to a shared file if not already.

**Step 2: Write landing page E2E test**

Create `e2e/landing.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("shows hero for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
  });

  test("get started navigates to signup", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Get Started");
    await expect(page).toHaveURL(/\/signup/);
  });
});
```

**Step 3: Run E2E tests to verify**

Run: `npm run test:e2e -- --grep "Settings|Landing"`
Expected: Tests pass (requires dev server)

**Step 4: Commit**

```bash
git add e2e/settings.spec.ts e2e/landing.spec.ts
git commit -m "test: add E2E tests for settings page and landing page"
```

---

### Task 7: Update MASTER_PLAN.md and Final Verification

**Files:**
- Modify: `MASTER_PLAN.md` (line 194, change ❌ to ✅)

**Step 1: Mark Phase 5 complete in master plan**

In `MASTER_PLAN.md`, change line 194 from:
```
### Phase 5: Polish + Settings ❌
```
to:
```
### Phase 5: Polish + Settings ✅
```

**Step 2: Run full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: All pass

**Step 3: Commit**

```bash
git add MASTER_PLAN.md
git commit -m "docs: mark Phase 5 complete"
```
