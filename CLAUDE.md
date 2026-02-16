# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npx convex dev           # Start Convex dev server (run alongside Next.js)
npm test                 # Run unit tests (Vitest)
npm run test:watch       # Run unit tests in watch mode
npm test -- --run src/lib/__tests__/budget-math.test.ts  # Run single test file
npm run test:e2e         # Run E2E tests (Playwright, auto-starts dev server)
npx tsc --noEmit         # TypeScript type check
npx convex dev --once    # Push schema + validate Convex functions (no watcher)
```

Both `npx convex dev` and `npm run dev` must be running for the app to work locally.

## Architecture

### Stack
Next.js 16 App Router + Convex (real-time backend) + Better Auth (`@convex-dev/better-auth`) + Tailwind/shadcn + Vitest/Playwright.

### Data flow
All data components use `'use client'` with Convex reactive hooks (`useQuery`, `useMutation`). No server components for data fetching, no TanStack Query. Convex handles real-time subscriptions and optimistic updates.

### Auth flow
Better Auth stores auth tables inside Convex via a component. The chain: `convex/auth.ts` (server auth instance) → `convex/http.ts` (registers auth routes) → `src/lib/auth-client.ts` (client) → `src/lib/auth-server.ts` (Next.js server helpers) → `src/app/api/auth/[...all]/route.ts` (catch-all handler). `ConvexBetterAuthProvider` wraps the app in `src/app/ConvexClientProvider.tsx`.

### Route protection
- `useAuthGuard` hook: checks auth + `userProfile.onboardingComplete`, redirects to `/login` or `/onboarding`. Used in `(app)` layout.
- `useRedirectIfAuthenticated` hook: sends logged-in users away from `/login` and `/signup`.

### Routing structure
- `/` → redirects to `/dashboard`
- `(auth)/` → login, signup (unauthenticated)
- `(app)/` → dashboard, budget, transactions, accounts, settings (protected by `useAuthGuard`)
- `/onboarding` → 5-step wizard (separate from both groups, has own auth check)

### Convex conventions
- Schema in `convex/schema.ts`, functions organized by domain: `users.ts`, `accounts.ts`, `categories.ts`, `incomeEntries.ts`, `budgetAllocations.ts`
- User profile table is `userProfiles` (not `users`) to avoid collision with Better Auth's internal tables. Linked via `betterAuthUserId` field.
- Month format: `YYYY-MM` strings everywhere
- Amounts always stored as positive numbers. Transaction `type` field distinguishes expense vs transfer.
- Account balances are computed (no denormalized field).

### Core math (`src/lib/budget-math.ts`)
- `readyToAssign = sum(incomeEntries for month) - sum(allocations for month)`
- `categorySpent = sum(expense transactions for category in month)`
- `accountBalance = initialBalance - sum(expense transactions)`

### Form UX pattern
On mobile (`<md`), use bottom sheet drawers. On desktop (`>=md`), use centered dialog modals. The `ResponsiveFormContainer` component handles this automatically — it renders a `Sheet` on mobile and a `Dialog` on desktop. Use it for all multi-field form surfaces (account forms, transaction forms, budget assignment). Lightweight actions (dropdown menus, inline renames, filter bars) stay as-is. See `src/components/ui/responsive-form-container.tsx`.

### Environment variables
Convex vars (`BETTER_AUTH_SECRET`, `SITE_URL`) are set via `npx convex env set`, not `.env.local`. The `.env.local` file only has `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL`.

## Project status

See `MASTER_PLAN.md` for full roadmap. Phases 1-4 complete. Phase 5 (Receipt Scanning + Polish) remains.
