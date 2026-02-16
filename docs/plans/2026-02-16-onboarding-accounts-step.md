# Onboarding Accounts Step Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an optional account creation step as the final step of the onboarding flow, allowing users to add multiple accounts before finishing.

**Architecture:** New `StepAccounts` component using the existing `OnboardingStepLayout` wrapper. Accounts are held in local state during onboarding and persisted via the existing `accounts.create` Convex mutation on finish. The onboarding page orchestrates the new step and passes accounts to `handleFinish`.

**Tech Stack:** React, Next.js, Convex, Tailwind, shadcn/ui components

---

### Task 1: Create StepAccounts component

**Files:**
- Create: `src/components/onboarding/StepAccounts.tsx`

**Step 1: Create the component**

This component manages a local list of accounts with an inline form to add them. It uses `OnboardingStepLayout` for consistent onboarding UI.

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingStepLayout } from "./OnboardingStepLayout";

export type OnboardingAccount = {
  name: string;
  type: "checking" | "savings" | "cash" | "credit";
  initialBalance: number;
};

interface StepAccountsProps {
  accounts: OnboardingAccount[];
  setAccounts: (accounts: OnboardingAccount[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const typeLabels: Record<OnboardingAccount["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
};

export function StepAccounts({
  accounts,
  setAccounts,
  onNext,
  onBack,
}: StepAccountsProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<OnboardingAccount["type"]>("checking");
  const [balance, setBalance] = useState("");

  function handleAdd() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const parsed = parseFloat(balance) || 0;
    setAccounts([
      ...accounts,
      {
        name: trimmedName,
        type,
        initialBalance: Math.round(parsed * 100) / 100,
      },
    ]);
    setName("");
    setType("checking");
    setBalance("");
  }

  function handleRemove(index: number) {
    setAccounts(accounts.filter((_, i) => i !== index));
  }

  return (
    <OnboardingStepLayout
      emoji="🏦"
      title="Add your accounts"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Finish"
      skipText="Skip for now — you can add accounts later"
      onSkip={onNext}
    >
      <div className="space-y-6 max-w-sm mx-auto">
        <p className="text-center text-muted-foreground">
          Where does your money live? Add your checking, savings, or other
          accounts.
        </p>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="acct-name">Account Name</Label>
            <Input
              id="acct-name"
              placeholder="e.g. Main Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleAdd();
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as OnboardingAccount["type"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acct-balance">Balance</Label>
              <Input
                id="acct-balance"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            variant="secondary"
            className="w-full"
            disabled={!name.trim()}
          >
            Add Account
          </Button>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((acct, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-sm">{acct.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[acct.type]} · ${acct.initialBalance.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </OnboardingStepLayout>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors related to StepAccounts

**Step 3: Commit**

```bash
git add src/components/onboarding/StepAccounts.tsx
git commit -m "feat: add StepAccounts onboarding component"
```

---

### Task 2: Integrate StepAccounts into onboarding page

**Files:**
- Modify: `src/app/onboarding/page.tsx`

**Step 1: Add accounts state and import**

At the top of the file, add the import:

```tsx
import { StepAccounts, type OnboardingAccount } from "@/components/onboarding/StepAccounts";
```

Inside the `OnboardingPage` component, add state after the existing `selections` state:

```tsx
const [accounts, setAccounts] = useState<OnboardingAccount[]>([]);
```

Also add the `createAccount` mutation:

```tsx
const createAccount = useMutation(api.accounts.create);
```

**Step 2: Update TOTAL_STEPS**

Change from:
```tsx
const TOTAL_STEPS = 1 + steps.length;
```
To:
```tsx
const TOTAL_STEPS = 1 + steps.length + 1; // name + lifestyle steps + accounts
```

**Step 3: Update handleFinish to create accounts**

After `await createDefaultTemplate(...)` and before `await completeOnboarding()`, add:

```tsx
for (const acct of accounts) {
  await createAccount({
    userId: profileId,
    name: acct.name,
    type: acct.type,
    initialBalance: acct.initialBalance,
  });
}
```

**Step 4: Add the accounts step rendering**

The accounts step is the very last step (index `TOTAL_STEPS - 1`). Currently, `isLastStep` makes the last lifestyle step show "Finish" and call `handleFinish`. We need to change this so:

- The last lifestyle step shows "Next" and advances to accounts step
- The accounts step shows "Finish" and calls `handleFinish`

In the rendering section, before the existing `return` for `StepSelection`, add a check for the accounts step:

```tsx
// Accounts step is the very last step
if (currentStep === TOTAL_STEPS - 1) {
  return (
    <div className="space-y-6">
      <div className="h-1 bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <StepAccounts
        accounts={accounts}
        setAccounts={setAccounts}
        onNext={handleFinish}
        onBack={handleBack}
      />
    </div>
  );
}
```

And update `isLastStep` for the lifestyle steps to no longer trigger on the last lifestyle step:

Change:
```tsx
const isLastStep = currentStep === TOTAL_STEPS - 1;
```
To:
```tsx
const isLastStep = false; // accounts step is now always last
```

**Step 5: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: integrate accounts step into onboarding flow"
```

---

### Task 3: Update E2E test

**Files:**
- Modify: `e2e/onboarding.spec.ts`

**Step 1: Update the E2E test to handle the accounts step**

After the last lifestyle step (Fun spending → click Next instead of Finish), add the accounts step. The test should skip the accounts step to keep the test simple.

Change step 10 from clicking "Finish" to clicking "Next":

```tsx
// Step 10: Fun spending — select Dining out, click Next (no longer last step)
await expect(
  page.getByText("What else do you want to include in your plan?")
).toBeVisible();
await page.click("text=Dining out");
await page.click('button:has-text("Next")');

// Step 11: Accounts — skip
await expect(page.getByText("Add your accounts")).toBeVisible();
await page.click("text=Skip for now");
```

The existing assertion for landing on dashboard remains unchanged.

**Step 2: Run E2E test**

Run: `npm run test:e2e -- --grep "full signup"`
Expected: PASS — test completes through all steps including the new accounts skip

**Step 3: Commit**

```bash
git add e2e/onboarding.spec.ts
git commit -m "test: update E2E test for onboarding accounts step"
```

---

### Task 4: Manual QA

**Step 1: Start dev servers**

Ensure both are running:
- `npm run dev` (Next.js)
- `npx convex dev` (Convex)

**Step 2: Test the happy path**

1. Sign up a new account → redirects to onboarding
2. Fill name, click through lifestyle steps
3. On accounts step: add 2 accounts (a checking and a savings)
4. Verify both show as cards with correct info
5. Remove one, verify it disappears
6. Click Finish → lands on dashboard
7. Navigate to Accounts page → verify the account was created

**Step 3: Test the skip path**

1. Sign up another account → go through to accounts step
2. Click "Skip for now — you can add accounts later"
3. Verify landing on dashboard
4. Navigate to Accounts page → verify no accounts exist

**Step 4: Test back navigation**

1. On accounts step, click Back → returns to last lifestyle step
2. Click Next → returns to accounts step with any previously added accounts preserved
