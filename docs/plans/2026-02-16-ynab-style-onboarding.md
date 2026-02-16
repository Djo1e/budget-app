# YNAB-Style Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current 5-step onboarding with a YNAB-inspired 10-step lifestyle questionnaire that builds personalized budget categories.

**Architecture:** Multi-step wizard with all selections stored in React state. On finish, a single Convex mutation creates the profile + categories in one batch. Old step components are deleted.

**Tech Stack:** Next.js, React, Convex mutations, Tailwind CSS, shadcn/ui components

---

### Task 1: Create the onboarding selection types and category mapping

**Files:**
- Create: `src/lib/onboarding-categories.ts`

**Step 1: Create the onboarding types and category mapping file**

This file defines all the step options and maps selections to category groups/categories.

```ts
export type OnboardingSelections = {
  name: string;
  household: string[];
  home: string | null;
  transportation: string[];
  debt: string[];
  regularSpending: string[];
  subscriptions: string[];
  lessFrequent: string[];
  goals: string[];
  funSpending: string[];
};

export const initialSelections: OnboardingSelections = {
  name: "",
  household: [],
  home: null,
  transportation: [],
  debt: [],
  regularSpending: [],
  subscriptions: [],
  lessFrequent: [],
  goals: [],
  funSpending: [],
};

export type StepConfig = {
  key: keyof Omit<OnboardingSelections, "name">;
  title: string;
  emoji: string;
  mode: "single" | "multi";
  options: { id: string; label: string; emoji: string }[];
  skipText?: string;
};

export const steps: StepConfig[] = [
  {
    key: "household",
    title: "Who's in your household?",
    emoji: "",
    mode: "multi",
    options: [
      { id: "myself", label: "Myself", emoji: "" },
      { id: "partner", label: "My partner", emoji: "" },
      { id: "kids", label: "Kids", emoji: "" },
      { id: "teens", label: "Teens", emoji: "" },
      { id: "other-adults", label: "Other adults", emoji: "" },
      { id: "pets", label: "Pets", emoji: "" },
    ],
  },
  {
    key: "home",
    title: "Tell us about your home",
    emoji: "\ud83c\udfe0",
    mode: "single",
    options: [
      { id: "rent", label: "I rent", emoji: "" },
      { id: "own", label: "I own", emoji: "" },
      { id: "other", label: "Other", emoji: "" },
    ],
  },
  {
    key: "transportation",
    title: "How do you get around?",
    emoji: "\ud83d\ude8b",
    mode: "multi",
    options: [
      { id: "car", label: "Car", emoji: "\ud83d\ude97" },
      { id: "rideshare", label: "Rideshare", emoji: "\ud83d\ude95" },
      { id: "bike", label: "Bike", emoji: "\ud83d\udeb2" },
      { id: "motorcycle", label: "Motorcycle", emoji: "\ud83c\udfcd\ufe0f" },
      { id: "walk", label: "Walk", emoji: "\ud83d\udc4b" },
      { id: "public-transit", label: "Public transit", emoji: "\ud83d\ude8c" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "debt",
    title: "Do you currently have any debt?",
    emoji: "",
    mode: "multi",
    options: [
      { id: "credit-card", label: "Credit card", emoji: "\ud83d\udcb3" },
      { id: "medical-debt", label: "Medical debt", emoji: "\ud83c\udfe5" },
      { id: "auto-loans", label: "Auto loans", emoji: "\ud83d\ude97" },
      { id: "bnpl", label: "Buy now, pay later", emoji: "\u231b" },
      { id: "student-loans", label: "Student loans", emoji: "\ud83c\udf93" },
      { id: "personal-loans", label: "Personal loans", emoji: "\ud83d\udcb0" },
    ],
    skipText: "I don't currently have debt",
  },
  {
    key: "regularSpending",
    title: "Which of these do you regularly spend money on?",
    emoji: "\ud83e\udd14",
    mode: "multi",
    options: [
      { id: "groceries", label: "Groceries", emoji: "\ud83d\uded2" },
      { id: "tv-phone-internet", label: "TV, phone or internet", emoji: "\ud83d\udcbb" },
      { id: "personal-care", label: "Personal care", emoji: "\ud83d\udc87" },
      { id: "clothing", label: "Clothing", emoji: "\ud83d\udc54" },
      { id: "self-storage", label: "Self storage", emoji: "\ud83d\udce6" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "subscriptions",
    title: "Which of these subscriptions do you have?",
    emoji: "\ud83c\udf7f",
    mode: "multi",
    options: [
      { id: "music", label: "Music", emoji: "\ud83c\udfb5" },
      { id: "tv-streaming", label: "TV streaming", emoji: "\ud83d\udcfa" },
      { id: "fitness", label: "Fitness", emoji: "\ud83d\udcaa" },
      { id: "other-subs", label: "Other subscriptions", emoji: "\ud83d\udcc4" },
    ],
    skipText: "I don't subscribe to any of these",
  },
  {
    key: "lessFrequent",
    title: "What less frequent expenses do you need to prepare for?",
    emoji: "\ud83d\udee0\ufe0f",
    mode: "multi",
    options: [
      { id: "cc-fees", label: "Annual credit card fees", emoji: "\ud83d\udcb3" },
      { id: "medical-expenses", label: "Medical expenses", emoji: "\ud83e\ude7a" },
      { id: "taxes", label: "Taxes or other fees", emoji: "\ud83c\udfa8" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "goals",
    title: "What goals do you want to prioritize?",
    emoji: "\ud83c\udf34",
    mode: "multi",
    options: [
      { id: "vacation", label: "Dream vacation", emoji: "\ud83c\udfd6\ufe0f" },
      { id: "new-baby", label: "New baby", emoji: "\ud83d\udc76" },
      { id: "new-car", label: "New car", emoji: "\ud83d\ude97" },
      { id: "emergency-fund", label: "Emergency fund", emoji: "\ud83d\ude05" },
      { id: "new-home", label: "New home", emoji: "\ud83c\udfe1" },
      { id: "retirement", label: "Retirement or investments", emoji: "\ud83d\udcb0" },
      { id: "wedding", label: "Wedding", emoji: "\ud83d\udc8d" },
    ],
    skipText: "I don't save for any of these",
  },
  {
    key: "funSpending",
    title: "What else do you want to include in your plan?",
    emoji: "\u2764\ufe0f",
    mode: "multi",
    options: [
      { id: "dining-out", label: "Dining out", emoji: "\ud83c\udf7d\ufe0f" },
      { id: "holidays-gifts", label: "Holidays & gifts", emoji: "\ud83c\udf81" },
      { id: "entertainment", label: "Entertainment", emoji: "\ud83c\udfa0" },
      { id: "decor-garden", label: "Decor & garden", emoji: "\ud83c\udf3f" },
      { id: "hobbies", label: "Hobbies", emoji: "\ud83e\udde9" },
      { id: "my-spending-money", label: "My spending money", emoji: "\ud83d\udc65" },
      { id: "charity", label: "Charity", emoji: "\ud83d\udc96" },
      { id: "their-spending-money", label: "Their spending money", emoji: "\ud83d\udc65" },
    ],
  },
];

type CategoryDef = { group: string; category: string };

const selectionToCategoryMap: Record<string, CategoryDef[]> = {
  // Household
  partner: [{ group: "Personal", category: "Their spending money" }],
  kids: [{ group: "Family", category: "Kids activities" }, { group: "Family", category: "School supplies" }],
  teens: [{ group: "Family", category: "Kids activities" }, { group: "Family", category: "School supplies" }],
  pets: [{ group: "Family", category: "Pet care" }],
  // Home
  rent: [{ group: "Housing", category: "Rent" }, { group: "Housing", category: "Renters insurance" }],
  own: [
    { group: "Housing", category: "Mortgage" },
    { group: "Housing", category: "Home insurance" },
    { group: "Housing", category: "Property taxes" },
    { group: "Housing", category: "Home maintenance" },
  ],
  other: [{ group: "Housing", category: "Housing" }],
  // Transportation
  car: [
    { group: "Transportation", category: "Gas/Fuel" },
    { group: "Transportation", category: "Car insurance" },
    { group: "Transportation", category: "Car maintenance" },
  ],
  rideshare: [{ group: "Transportation", category: "Rideshare" }],
  bike: [{ group: "Transportation", category: "Bike maintenance" }],
  motorcycle: [{ group: "Transportation", category: "Motorcycle" }],
  walk: [],
  "public-transit": [{ group: "Transportation", category: "Public transit" }],
  // Debt
  "credit-card": [{ group: "Debt", category: "Credit card payments" }],
  "medical-debt": [{ group: "Debt", category: "Medical debt payments" }],
  "auto-loans": [{ group: "Debt", category: "Auto loan payments" }],
  bnpl: [{ group: "Debt", category: "Buy now, pay later" }],
  "student-loans": [{ group: "Debt", category: "Student loan payments" }],
  "personal-loans": [{ group: "Debt", category: "Personal loan payments" }],
  // Regular spending
  groceries: [{ group: "Food", category: "Groceries" }],
  "tv-phone-internet": [{ group: "Utilities", category: "TV/Phone/Internet" }],
  "personal-care": [{ group: "Personal", category: "Personal care" }],
  clothing: [{ group: "Shopping", category: "Clothing" }],
  "self-storage": [{ group: "Housing", category: "Self storage" }],
  // Subscriptions
  music: [{ group: "Subscriptions", category: "Music" }],
  "tv-streaming": [{ group: "Subscriptions", category: "TV streaming" }],
  fitness: [{ group: "Subscriptions", category: "Fitness" }],
  "other-subs": [{ group: "Subscriptions", category: "Other subscriptions" }],
  // Less frequent
  "cc-fees": [{ group: "Less Frequent", category: "Annual credit card fees" }],
  "medical-expenses": [{ group: "Less Frequent", category: "Medical expenses" }],
  taxes: [{ group: "Less Frequent", category: "Taxes or fees" }],
  // Goals
  vacation: [{ group: "Savings Goals", category: "Dream vacation" }],
  "new-baby": [{ group: "Savings Goals", category: "New baby" }],
  "new-car": [{ group: "Savings Goals", category: "New car" }],
  "emergency-fund": [{ group: "Savings Goals", category: "Emergency fund" }],
  "new-home": [{ group: "Savings Goals", category: "New home" }],
  retirement: [{ group: "Savings Goals", category: "Retirement or investments" }],
  wedding: [{ group: "Savings Goals", category: "Wedding" }],
  // Fun spending
  "dining-out": [{ group: "Food", category: "Dining out" }],
  "holidays-gifts": [{ group: "Personal", category: "Holidays & gifts" }],
  entertainment: [{ group: "Entertainment", category: "Entertainment" }],
  "decor-garden": [{ group: "Home", category: "Decor & garden" }],
  hobbies: [{ group: "Entertainment", category: "Hobbies" }],
  "my-spending-money": [{ group: "Personal", category: "My spending money" }],
  charity: [{ group: "Personal", category: "Charity" }],
  "their-spending-money": [{ group: "Personal", category: "Their spending money" }],
};

export type CategoryTemplateGroup = {
  name: string;
  sortOrder: number;
  categories: { name: string; sortOrder: number; isDefault: boolean }[];
};

export function buildCategoryTemplate(selections: OnboardingSelections): CategoryTemplateGroup[] {
  const allSelectionIds = [
    ...selections.household,
    ...(selections.home ? [selections.home] : []),
    ...selections.transportation,
    ...selections.debt,
    ...selections.regularSpending,
    ...selections.subscriptions,
    ...selections.lessFrequent,
    ...selections.goals,
    ...selections.funSpending,
  ];

  // Collect unique group -> categories
  const groupMap = new Map<string, Set<string>>();

  for (const id of allSelectionIds) {
    const defs = selectionToCategoryMap[id];
    if (!defs) continue;
    for (const def of defs) {
      if (!groupMap.has(def.group)) {
        groupMap.set(def.group, new Set());
      }
      groupMap.get(def.group)!.add(def.category);
    }
  }

  // Always add Miscellaneous > Uncategorized
  if (!groupMap.has("Miscellaneous")) {
    groupMap.set("Miscellaneous", new Set());
  }
  groupMap.get("Miscellaneous")!.add("Uncategorized");

  // Define group sort order
  const groupOrder = [
    "Housing", "Utilities", "Food", "Transportation", "Family",
    "Debt", "Shopping", "Subscriptions", "Entertainment", "Personal",
    "Less Frequent", "Savings Goals", "Home", "Miscellaneous",
  ];

  const template: CategoryTemplateGroup[] = [];
  let sortIdx = 0;

  for (const groupName of groupOrder) {
    const cats = groupMap.get(groupName);
    if (!cats || cats.size === 0) continue;
    template.push({
      name: groupName,
      sortOrder: sortIdx++,
      categories: Array.from(cats).map((name, i) => ({
        name,
        sortOrder: i,
        isDefault: true,
      })),
    });
  }

  return template;
}
```

**Step 2: Commit**

```bash
git add src/lib/onboarding-categories.ts
git commit -m "feat: add onboarding selection types and category mapping"
```

---

### Task 2: Add unit tests for buildCategoryTemplate

**Files:**
- Create: `src/lib/__tests__/onboarding-categories.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { buildCategoryTemplate, initialSelections, type OnboardingSelections } from "../onboarding-categories";

describe("buildCategoryTemplate", () => {
  it("always includes Miscellaneous > Uncategorized even with no selections", () => {
    const result = buildCategoryTemplate(initialSelections);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Miscellaneous");
    expect(result[0].categories[0].name).toBe("Uncategorized");
  });

  it("creates Housing group with rent categories when rent selected", () => {
    const selections: OnboardingSelections = { ...initialSelections, home: "rent" };
    const result = buildCategoryTemplate(selections);
    const housing = result.find((g) => g.name === "Housing");
    expect(housing).toBeDefined();
    const catNames = housing!.categories.map((c) => c.name);
    expect(catNames).toContain("Rent");
    expect(catNames).toContain("Renters insurance");
  });

  it("creates Housing group with own categories when own selected", () => {
    const selections: OnboardingSelections = { ...initialSelections, home: "own" };
    const result = buildCategoryTemplate(selections);
    const housing = result.find((g) => g.name === "Housing");
    expect(housing).toBeDefined();
    const catNames = housing!.categories.map((c) => c.name);
    expect(catNames).toContain("Mortgage");
    expect(catNames).toContain("Home insurance");
    expect(catNames).toContain("Property taxes");
    expect(catNames).toContain("Home maintenance");
  });

  it("creates Transportation categories for car selection", () => {
    const selections: OnboardingSelections = { ...initialSelections, transportation: ["car"] };
    const result = buildCategoryTemplate(selections);
    const transport = result.find((g) => g.name === "Transportation");
    expect(transport).toBeDefined();
    const catNames = transport!.categories.map((c) => c.name);
    expect(catNames).toContain("Gas/Fuel");
    expect(catNames).toContain("Car insurance");
    expect(catNames).toContain("Car maintenance");
  });

  it("creates Debt group for multiple debt selections", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      debt: ["credit-card", "student-loans"],
    };
    const result = buildCategoryTemplate(selections);
    const debt = result.find((g) => g.name === "Debt");
    expect(debt).toBeDefined();
    const catNames = debt!.categories.map((c) => c.name);
    expect(catNames).toContain("Credit card payments");
    expect(catNames).toContain("Student loan payments");
  });

  it("deduplicates categories when same category from multiple selections", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      household: ["partner"],
      funSpending: ["their-spending-money"],
    };
    const result = buildCategoryTemplate(selections);
    const personal = result.find((g) => g.name === "Personal");
    expect(personal).toBeDefined();
    const matching = personal!.categories.filter((c) => c.name === "Their spending money");
    expect(matching).toHaveLength(1);
  });

  it("assigns sequential sortOrder to groups", () => {
    const selections: OnboardingSelections = {
      ...initialSelections,
      home: "rent",
      transportation: ["car"],
      regularSpending: ["groceries"],
    };
    const result = buildCategoryTemplate(selections);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].sortOrder).toBe(i);
    }
  });

  it("handles full selection scenario", () => {
    const selections: OnboardingSelections = {
      name: "Test",
      household: ["myself", "partner", "kids", "pets"],
      home: "own",
      transportation: ["car", "public-transit"],
      debt: ["credit-card"],
      regularSpending: ["groceries", "clothing"],
      subscriptions: ["music", "tv-streaming"],
      lessFrequent: ["medical-expenses"],
      goals: ["emergency-fund", "vacation"],
      funSpending: ["dining-out", "entertainment", "hobbies"],
    };
    const result = buildCategoryTemplate(selections);
    const groupNames = result.map((g) => g.name);
    expect(groupNames).toContain("Housing");
    expect(groupNames).toContain("Food");
    expect(groupNames).toContain("Transportation");
    expect(groupNames).toContain("Family");
    expect(groupNames).toContain("Debt");
    expect(groupNames).toContain("Shopping");
    expect(groupNames).toContain("Subscriptions");
    expect(groupNames).toContain("Entertainment");
    expect(groupNames).toContain("Personal");
    expect(groupNames).toContain("Less Frequent");
    expect(groupNames).toContain("Savings Goals");
    expect(groupNames).toContain("Miscellaneous");
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/onboarding-categories.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/lib/__tests__/onboarding-categories.test.ts
git commit -m "test: add unit tests for onboarding category builder"
```

---

### Task 3: Update Convex createProfile mutation to default currency

**Files:**
- Modify: `convex/users.ts:19-46` (the `createProfile` mutation)

**Step 1: Make currency optional with default "USD"**

Change the `createProfile` mutation args to make currency optional:

```ts
export const createProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_betterAuthUserId", (q) =>
        q.eq("betterAuthUserId", identity.subject)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("userProfiles", {
      betterAuthUserId: identity.subject,
      email: args.email,
      name: args.name,
      currency: args.currency ?? "USD",
      onboardingComplete: false,
    });
  },
});
```

**Step 2: Verify Convex validates**

Run: `npx convex dev --once`
Expected: Success, no errors

**Step 3: Commit**

```bash
git add convex/users.ts
git commit -m "feat: make currency optional in createProfile, default USD"
```

---

### Task 4: Create the OnboardingOptionCard component

**Files:**
- Create: `src/components/onboarding/OnboardingOptionCard.tsx`

**Step 1: Build the selectable option card component**

This is the rounded rectangle that users click to toggle selection. Matches YNAB style: light gray background, turns blue/purple with checkmark when selected.

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OnboardingOptionCardProps {
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}

export function OnboardingOptionCard({
  label,
  emoji,
  selected,
  onClick,
}: OnboardingOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-5 py-4 text-left text-sm font-medium transition-colors",
        selected
          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
          : "bg-muted/50 text-foreground hover:bg-muted"
      )}
    >
      {emoji && <span className="text-base">{emoji}</span>}
      <span>{label}</span>
      {selected && (
        <Check className="absolute right-4 h-4 w-4 text-primary" />
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/onboarding/OnboardingOptionCard.tsx
git commit -m "feat: add OnboardingOptionCard component"
```

---

### Task 5: Create the OnboardingStepLayout component

**Files:**
- Create: `src/components/onboarding/OnboardingStepLayout.tsx`

**Step 1: Build the step layout wrapper**

This wraps each step with the title, options grid, skip link, and navigation buttons.

```tsx
"use client";

import { Button } from "@/components/ui/button";

interface OnboardingStepLayoutProps {
  emoji: string;
  title: string;
  children: React.ReactNode;
  skipText?: string;
  onSkip?: () => void;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function OnboardingStepLayout({
  emoji,
  title,
  children,
  skipText,
  onSkip,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
}: OnboardingStepLayoutProps) {
  return (
    <div className="flex min-h-[400px] flex-col">
      <div className="flex-1 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {emoji && <span className="mr-1">{emoji}</span>}
            {title}
          </h1>
        </div>

        {children}

        {skipText && onSkip && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-primary hover:underline"
            >
              {skipText}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-8">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        <Button onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/onboarding/OnboardingStepLayout.tsx
git commit -m "feat: add OnboardingStepLayout component"
```

---

### Task 6: Create the StepName component (step 1)

**Files:**
- Create: `src/components/onboarding/StepName.tsx`

**Step 1: Build the name input step**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingStepLayout } from "./OnboardingStepLayout";

interface StepNameProps {
  name: string;
  setName: (name: string) => void;
  onNext: () => void;
}

export function StepName({ name, setName, onNext }: StepNameProps) {
  return (
    <OnboardingStepLayout
      emoji=""
      title="Let's get started."
      onNext={onNext}
      nextDisabled={name.trim().length === 0}
    >
      <div className="space-y-4 max-w-sm mx-auto">
        <p className="text-center text-muted-foreground">
          First things first, what should we call you?
        </p>
        <div className="space-y-2">
          <Label htmlFor="onboarding-name">Name</Label>
          <Input
            id="onboarding-name"
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim().length > 0) onNext();
            }}
            autoFocus
          />
        </div>
      </div>
    </OnboardingStepLayout>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/onboarding/StepName.tsx
git commit -m "feat: add StepName onboarding component"
```

---

### Task 7: Create the StepSelection component (generic step for all selection screens)

**Files:**
- Create: `src/components/onboarding/StepSelection.tsx`

**Step 1: Build the generic selection step**

This handles both single-select and multi-select modes. Used for steps 2-10.

```tsx
"use client";

import { OnboardingOptionCard } from "./OnboardingOptionCard";
import { OnboardingStepLayout } from "./OnboardingStepLayout";
import type { StepConfig } from "@/lib/onboarding-categories";

interface StepSelectionProps {
  config: StepConfig;
  selected: string[];
  onSelect: (selected: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  showPartnerOption?: boolean;
}

export function StepSelection({
  config,
  selected,
  onSelect,
  onNext,
  onBack,
  isLastStep = false,
  showPartnerOption = true,
}: StepSelectionProps) {
  const options = config.options.filter(
    (opt) => showPartnerOption || opt.id !== "their-spending-money"
  );

  function handleToggle(id: string) {
    if (config.mode === "single") {
      onSelect([id]);
    } else {
      onSelect(
        selected.includes(id)
          ? selected.filter((s) => s !== id)
          : [...selected, id]
      );
    }
  }

  function handleSkip() {
    onSelect([]);
    onNext();
  }

  const hasSelection = selected.length > 0;
  const useWideGrid = options.length >= 6;

  return (
    <OnboardingStepLayout
      emoji={config.emoji}
      title={config.title}
      onNext={onNext}
      onBack={onBack}
      nextLabel={isLastStep ? "Finish" : "Next"}
      nextDisabled={!hasSelection && !config.skipText}
      skipText={config.skipText}
      onSkip={handleSkip}
    >
      <div
        className={
          useWideGrid
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "flex flex-col gap-3 max-w-md mx-auto"
        }
      >
        {options.map((opt) => (
          <OnboardingOptionCard
            key={opt.id}
            label={opt.label}
            emoji={opt.emoji}
            selected={selected.includes(opt.id)}
            onClick={() => handleToggle(opt.id)}
          />
        ))}
      </div>
    </OnboardingStepLayout>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/onboarding/StepSelection.tsx
git commit -m "feat: add generic StepSelection onboarding component"
```

---

### Task 8: Rewrite the onboarding page

**Files:**
- Modify: `src/app/onboarding/page.tsx` (full rewrite)

**Step 1: Rewrite the onboarding page with new flow**

Replace entire contents of `src/app/onboarding/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { StepName } from "@/components/onboarding/StepName";
import { StepSelection } from "@/components/onboarding/StepSelection";
import {
  steps,
  initialSelections,
  buildCategoryTemplate,
  type OnboardingSelections,
} from "@/lib/onboarding-categories";

const TOTAL_STEPS = 1 + steps.length; // name step + selection steps

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<OnboardingSelections>(initialSelections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const session = authClient.useSession();
  const createProfile = useMutation(api.users.createProfile);
  const createDefaultTemplate = useMutation(api.categories.createDefaultTemplate);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  function handleNext() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    if (!session.data?.user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const profileId = await createProfile({
        name: selections.name,
        email: session.data.user.email ?? "",
      });

      const template = buildCategoryTemplate(selections);
      await createDefaultTemplate({ userId: profileId, template });
      await completeOnboarding();

      router.push("/dashboard");
    } catch {
      setIsSubmitting(false);
    }
  }

  const hasPartner = selections.household.includes("partner");

  if (currentStep === 0) {
    return (
      <div className="space-y-6">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <StepName
          name={selections.name}
          setName={(name) => setSelections((s) => ({ ...s, name }))}
          onNext={handleNext}
        />
      </div>
    );
  }

  const stepIndex = currentStep - 1;
  const stepConfig = steps[stepIndex];
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  function getSelected(): string[] {
    const val = selections[stepConfig.key];
    if (val === null) return [];
    if (typeof val === "string") return [val];
    return val;
  }

  function setSelected(selected: string[]) {
    setSelections((s) => {
      if (stepConfig.mode === "single") {
        return { ...s, [stepConfig.key]: selected[0] ?? null };
      }
      return { ...s, [stepConfig.key]: selected };
    });
  }

  return (
    <div className="space-y-6">
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <StepSelection
        config={stepConfig}
        selected={getSelected()}
        onSelect={setSelected}
        onNext={isLastStep ? handleFinish : handleNext}
        onBack={handleBack}
        isLastStep={isLastStep}
        showPartnerOption={hasPartner}
      />
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/onboarding/page.tsx
git commit -m "feat: rewrite onboarding page with YNAB-style flow"
```

---

### Task 9: Delete old onboarding step components

**Files:**
- Delete: `src/components/onboarding/StepCurrency.tsx`
- Delete: `src/components/onboarding/StepAccounts.tsx`
- Delete: `src/components/onboarding/StepIncome.tsx`
- Delete: `src/components/onboarding/StepCategories.tsx`
- Delete: `src/components/onboarding/StepAssign.tsx`

**Step 1: Remove old step files**

```bash
rm src/components/onboarding/StepCurrency.tsx
rm src/components/onboarding/StepAccounts.tsx
rm src/components/onboarding/StepIncome.tsx
rm src/components/onboarding/StepCategories.tsx
rm src/components/onboarding/StepAssign.tsx
```

**Step 2: Verify no remaining imports reference them**

Run: `npx tsc --noEmit`
Expected: No errors (the page.tsx rewrite already removed the imports)

**Step 3: Commit**

```bash
git add -u src/components/onboarding/
git commit -m "chore: remove old onboarding step components"
```

---

### Task 10: Update E2E tests for new onboarding flow

**Files:**
- Modify: `e2e/onboarding.spec.ts`

**Step 1: Rewrite E2E test for new flow**

```ts
import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  const testUser = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  test("full signup to dashboard flow", async ({ page }) => {
    // Visit root — shows landing page with Get Started link
    await page.goto("/");
    await page.click("text=Get Started");
    await expect(page).toHaveURL(/\/signup/);

    // Fill signup form
    await page.fill("#name", testUser.name);
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // Step 1: Name
    await expect(page.getByText("Let's get started.")).toBeVisible();
    await page.fill("#onboarding-name", "TestName");
    await page.click('button:has-text("Next")');

    // Step 2: Household — select "Myself"
    await expect(page.getByText("Who's in your household?")).toBeVisible();
    await page.click("text=Myself");
    await page.click('button:has-text("Next")');

    // Step 3: Home — select "I rent"
    await expect(page.getByText("Tell us about your home")).toBeVisible();
    await page.click("text=I rent");
    await page.click('button:has-text("Next")');

    // Step 4: Transportation — skip
    await expect(page.getByText("How do you get around?")).toBeVisible();
    await page.click("text=None of these apply to me");

    // Step 5: Debt — skip
    await expect(page.getByText("Do you currently have any debt?")).toBeVisible();
    await page.click("text=I don't currently have debt");

    // Step 6: Regular spending — select Groceries
    await expect(
      page.getByText("Which of these do you regularly spend money on?")
    ).toBeVisible();
    await page.click("text=Groceries");
    await page.click('button:has-text("Next")');

    // Step 7: Subscriptions — skip
    await expect(
      page.getByText("Which of these subscriptions do you have?")
    ).toBeVisible();
    await page.click("text=I don't subscribe to any of these");

    // Step 8: Less frequent — skip
    await expect(
      page.getByText("What less frequent expenses do you need to prepare for?")
    ).toBeVisible();
    await page.click("text=None of these apply to me");

    // Step 9: Goals — select Emergency fund
    await expect(
      page.getByText("What goals do you want to prioritize?")
    ).toBeVisible();
    await page.click("text=Emergency fund");
    await page.click('button:has-text("Next")');

    // Step 10: Fun spending — select Dining out, click Finish
    await expect(
      page.getByText("What else do you want to include in your plan?")
    ).toBeVisible();
    await page.click("text=Dining out");
    await page.click('button:has-text("Finish")');

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: Both tests pass

**Step 3: Commit**

```bash
git add e2e/onboarding.spec.ts
git commit -m "test: update E2E tests for new YNAB-style onboarding"
```

---

### Task 11: Manual visual QA and polish

**Step 1: Start dev servers and walk through the flow manually**

Run: `npm run dev` and `npx convex dev` (in separate terminals)

Verify:
- Progress bar fills smoothly across all 10 steps
- Option cards toggle correctly (blue highlight + checkmark)
- Single-select steps (Home) only allow one selection
- Multi-select steps allow multiple
- Skip links advance to next step and clear selections
- Back button works on all steps
- "Their spending money" only shows on fun step when partner is selected in household step
- Finish creates profile + categories and redirects to dashboard
- Categories on dashboard match what was selected

**Step 2: Fix any visual issues found**

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish onboarding UI"
```
