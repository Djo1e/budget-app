# Unified Dark Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the landing page's premium dark minimalist aesthetic (dark-only, sharp corners, mono typography) across the entire app.

**Architecture:** CSS-first approach — update the CSS custom properties in globals.css to dark-only values with zero border radius, then update components that have hardcoded colors/styles. The landing page already has the target aesthetic; we're bringing everything else in line.

**Tech Stack:** Tailwind CSS custom properties, shadcn/ui components, Next.js

---

### Task 1: Update globals.css — Dark-only color system with zero radius

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace the CSS custom properties**

Replace the entire `:root` and `.dark` blocks with a single `:root` block using dark-only values. Set `--radius: 0` for sharp corners. Remove `@custom-variant dark`.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  --radius: 0px;
  --background: #0a0a0a;
  --foreground: #ffffff;
  --card: rgba(255, 255, 255, 0.03);
  --card-foreground: #ffffff;
  --popover: #141414;
  --popover-foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: rgba(255, 255, 255, 0.06);
  --secondary-foreground: #ffffff;
  --muted: rgba(255, 255, 255, 0.06);
  --muted-foreground: rgba(255, 255, 255, 0.5);
  --accent: rgba(255, 255, 255, 0.08);
  --accent-foreground: #ffffff;
  --destructive: oklch(0.704 0.191 22.216);
  --border: rgba(255, 255, 255, 0.10);
  --input: rgba(255, 255, 255, 0.10);
  --ring: rgba(255, 255, 255, 0.3);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: #0a0a0a;
  --sidebar-foreground: rgba(255, 255, 255, 0.5);
  --sidebar-primary: #ffffff;
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: rgba(255, 255, 255, 0.08);
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.10);
  --sidebar-ring: rgba(255, 255, 255, 0.3);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 2: Verify the dev server still works**

Run: `npm run dev` (already running)
Check: App should render with dark background, white text, no rounded corners.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: switch to dark-only color system with zero border radius"
```

---

### Task 2: Update root layout — add dark class, remove dark: variant references

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add `dark` class to html element (for any remaining dark: prefixes in shadcn) and set selection colors**

Change the `<html>` tag to include `className="dark"` and add selection styling:

```tsx
<html lang="en" className="dark">
```

This ensures any remaining `dark:` prefixes in shadcn components still work during transition.

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add dark class to root html element"
```

---

### Task 3: Update shadcn UI components — remove dark: prefixes, remove shadows, fix hardcoded colors

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/slider.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`

**Step 1: Update button.tsx**

Remove `dark:` prefixes and shadow. Replace `rounded-md` in base with inherited (already 0 from radius). Remove `text-white` from destructive (now `text-foreground`). Remove `shadow-xs` from outline.

In `button.tsx`, update the base class string:
- Remove `rounded-md` from base (it will be 0 via CSS var)
- Remove all `dark:` prefixed classes since we're dark-only
- Change destructive `text-white` to `text-foreground`
- Remove `shadow-xs` from outline variant

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 bg-destructive/60",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground bg-input/30 border-input hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      ...
    },
  }
)
```

**Step 2: Update card.tsx**

Remove `shadow-sm` and keep `rounded-xl` (which will be 0+4=4... actually with --radius:0, --radius-xl = 0+4 = 4px). We want truly sharp corners, so change to `rounded-none` explicitly for cards.

In `card.tsx`, change the Card class:
```tsx
"bg-card text-card-foreground flex flex-col gap-6 border py-6",
```

**Step 3: Update input.tsx**

Remove `dark:` prefix classes, remove `shadow-xs`.

```tsx
"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
"aria-invalid:ring-destructive/20 aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
```

**Step 4: Update badge.tsx**

Remove `dark:` classes, change destructive `text-white` to `text-foreground`.

**Step 5: Update slider.tsx**

Change the thumb's `bg-white` to `bg-foreground` so it uses the theme token.

In slider.tsx line 56, change:
```tsx
className="border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-foreground shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
```

**Step 6: Update dialog.tsx**

Remove `shadow-lg` and `rounded-lg` from DialogContent. Remove `bg-black/50` overlay (keep it since we're dark-only — `bg-black/50` is fine on a dark bg, but let's use `bg-black/80` for better contrast).

In dialog.tsx line 42: change `bg-black/50` to `bg-black/80`
In dialog.tsx line 64: remove `rounded-lg` and `shadow-lg`

**Step 7: Update sheet.tsx**

Change overlay to `bg-black/80`. Remove `shadow-lg` from content.

In sheet.tsx line 39: change `bg-black/50` to `bg-black/80`
In sheet.tsx line 63: remove `shadow-lg`

**Step 8: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/badge.tsx src/components/ui/slider.tsx src/components/ui/dialog.tsx src/components/ui/sheet.tsx
git commit -m "feat: update shadcn components for dark-only theme"
```

---

### Task 4: Update AppShell — mono typography for navigation

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

**Step 1: Update the sidebar**

Change the sidebar title and nav items to use mono font, uppercase, and wide tracking.

Sidebar title (line 34):
```tsx
<h1 className="text-xs font-mono tracking-[0.2em] uppercase">Budget</h1>
```

Nav items (line 42):
```tsx
className={cn(
  "flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors hover:bg-accent",
  pathname.startsWith(item.href)
    ? "text-foreground"
    : "text-muted-foreground"
)}
```

**Step 2: Update the mobile bottom nav**

Mobile nav items (line 62):
```tsx
className={cn(
  "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em]",
  pathname.startsWith(item.href)
    ? "text-foreground"
    : "text-muted-foreground"
)}
```

**Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: apply mono typography to sidebar and mobile nav"
```

---

### Task 5: Update landing page — use CSS variables instead of hardcoded colors

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace hardcoded colors with theme tokens**

Now that the root theme IS the dark theme, the landing page can use theme tokens instead of hardcoded colors:

- `bg-[#0a0a0a]` → `bg-background`
- `text-white` → `text-foreground`
- `text-white/30` → `text-foreground/30`
- `text-white/40` → `text-foreground/40`
- `text-white/50` → `text-foreground/50`
- `text-white/15` → `text-foreground/15`
- `text-white/20` → `text-foreground/20`
- `bg-white text-black` → `bg-primary text-primary-foreground`
- `bg-white/90` → `bg-primary/90`
- `bg-white/10` → `border-border` (or `bg-border`)
- `selection:bg-white selection:text-black` → `selection:bg-primary selection:text-primary-foreground`
- White opacity references in inline styles (rgba) stay as-is since they're in the geometric grid effect

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: landing page uses theme tokens instead of hardcoded colors"
```

---

### Task 6: Update app-specific components — fix hardcoded colors

**Files:**
- Modify: `src/components/transactions/SwipeableRow.tsx`
- Modify: `src/components/budget/ReadyToAssignBanner.tsx`
- Modify: `src/components/onboarding/OnboardingOptionCard.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/(app)/settings/page.tsx`

**Step 1: Fix SwipeableRow.tsx**

Line 73: Change `bg-blue-500 text-white` to `bg-accent text-foreground`

**Step 2: Fix ReadyToAssignBanner.tsx**

Line 21: Replace the hardcoded green colors. Remove `dark:` prefix:
```tsx
!isNegative && !isZero && "bg-green-950 text-green-400"
```

Also change `rounded-lg` to `rounded-none` (line 18).

**Step 3: Fix OnboardingOptionCard.tsx**

Line 24: Change `rounded-lg` to `rounded-none`:
```tsx
"relative flex items-center gap-3 px-5 py-4 text-left text-sm font-medium transition-colors",
```

**Step 4: Fix onboarding progress bar**

In `src/app/onboarding/page.tsx`, lines 64 and 101: change `rounded-full` to `rounded-none` on progress bar:
```tsx
<div className="h-1 bg-muted overflow-hidden">
```

**Step 5: Fix settings page**

In `src/app/(app)/settings/page.tsx`:
- Line 28: Change `rounded-full` on spinner to keep as-is (spinners are fine rounded)
- Lines 114, 121: Change `rounded-md` to remove (inherited zero radius is fine)
- Line 57: Add mono typography to the heading:
```tsx
<h1 className="text-xs font-mono tracking-[0.2em] uppercase">Settings</h1>
```

**Step 6: Commit**

```bash
git add src/components/transactions/SwipeableRow.tsx src/components/budget/ReadyToAssignBanner.tsx src/components/onboarding/OnboardingOptionCard.tsx src/app/onboarding/page.tsx src/app/(app)/settings/page.tsx
git commit -m "feat: fix hardcoded colors and rounded corners in app components"
```

---

### Task 7: Update page headings across app to use mono typography

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/budget/page.tsx`
- Modify: `src/app/(app)/transactions/page.tsx`
- Modify: `src/app/(app)/accounts/page.tsx`

**Step 1: Find and update all page headings**

Search for `text-2xl font-bold` or similar heading patterns in each page. Change to mono/uppercase/tracked style:

Pattern to apply to main page titles:
```tsx
className="text-xs font-mono tracking-[0.2em] uppercase"
```

Section headers (like CardTitle):
```tsx
className="text-xs font-mono tracking-[0.2em] uppercase"
```

**Step 2: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/app/(app)/budget/page.tsx src/app/(app)/transactions/page.tsx src/app/(app)/accounts/page.tsx
git commit -m "feat: apply mono typography to all page headings"
```

---

### Task 8: Visual review and polish

**Step 1: Start the dev server and review all pages**

Navigate through every page in the browser:
- Landing page (`/`)
- Login (`/login`)
- Signup (`/signup`)
- Dashboard (`/dashboard`)
- Budget (`/budget`)
- Transactions (`/transactions`)
- Accounts (`/accounts`)
- Settings (`/settings`)

**Step 2: Fix any remaining visual issues**

Look for:
- Any remaining `rounded-*` classes that should be sharp
- Any remaining light-mode colors
- Any remaining `dark:` prefixes that are now redundant
- Typography inconsistencies
- Contrast issues

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (visual changes shouldn't break functionality)

**Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: polish dark theme across all pages"
```
