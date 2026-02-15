# MASTER_PLAN.md — Budget App

## Context

Building an AI-first, zero-based budgeting app — cheaper and simpler than YNAB. Open source with a hosted paid version at $4.99-6.99/mo. This plan captures every architectural and UX decision from the detailed interview process and splits implementation into 5 vertical phases, each independently deployable and testable.

---

## Decisions Summary

### Architecture
- **Framework:** Next.js (App Router, `'use client'` on all data components, server-side only for AI API routes)
- **Backend:** Convex (real-time, all data + file storage)
- **Auth:** Better Auth via `@convex-dev/better-auth` — stores auth tables in Convex directly
- **State:** Convex reactive hooks only (no TanStack Query). Plain fetch for AI API routes
- **AI:** Anthropic via Vercel AI SDK, called from Next.js API routes. ConvexHttpClient for server-side data access
- **Validation:** Zod
- **UI:** Tailwind + shadcn/ui (defaults, no heavy customization)
- **Testing:** Full TDD — Playwright E2E for critical flows, colocated unit/component tests
- **Deployment:** Vercel + Convex Cloud
- **File storage:** Convex built-in file storage (receipts)

### Data Model Decisions
- **Income:** "Starting balance" model — user adds income entries anytime (tracked: amount, date, optional label). Sum of income entries = ready to assign. No inflow transactions concept. Transactions only subtract
- **Amounts:** Always stored as positive numbers. Transaction has a `type` field: `'expense' | 'transfer'`. Income is a separate entity, not a transaction
- **Month model:** Fresh each month. No rollover in MVP. Each month starts clean — unspent money returns to ready to assign
- **Account balances:** Computed always (sum of transactions). No denormalized balance field. Acceptable perf for MVP
- **Budget activity:** Computed by loading all transactions for the month. Acceptable for MVP scale
- **Payees:** Separate Payee entity with default category mapping. Silent auto-learn: after 2+ transactions with same payee+category, save mapping. If user overrides category, update the mapping
- **Categories:** Full CRUD. Deleting a category sets its transactions to 'Uncategorized'
- **Transfers:** Deferred to post-MVP
- **Currency conversion:** Show rate and confirm before converting. Deferred to post-MVP for simplicity — MVP is single currency, no conversion

### AI Decisions
- **NL transaction entry:** Next.js API route + Claude. Always shows pre-filled form for confirmation, never auto-creates
- **Chat:** Floating widget on every page. Session memory (resets on page reload). Tool-calling approach with ~5 core tools: `get_spending_by_category(month)`, `get_account_balances()`, `get_ready_to_assign()`, `get_recent_transactions(n)`, `get_category_list()`
- **Receipt scanning:** Vision model extracts line items, splits into multiple independent transactions (same payee/date/receipt URL, different categories). 30 receipts/month limit, no visible counter, error toast at limit
- **Self-host:** Env vars only (`ANTHROPIC_API_KEY`)

### UX Decisions
- **URL structure:** Dashboard hub — `/dashboard` (home after login), `/budget`, `/transactions`, `/accounts`, `/settings`
- **Dashboard:** Budget-focused — ready to assign (prominent), top spending categories, recent 5 transactions, quick-add button, account balances
- **Budget assignment:** Slider/progress bars. Dragging assigns from ready-to-assign pool. Over-assigning allowed — ready to assign goes negative with red warning
- **Chat:** Floating bubble bottom-right, available on all pages
- **Mobile:** Bottom tab nav (Dashboard, Budget, Transactions, More). Chat stays as floating bubble
- **Mobile inputs:** All edit/input interactions on mobile use bottom sheet drawers (`Sheet side="bottom"`) instead of inline editing or modals — feels native. Desktop keeps inline controls. See `AssignmentDrawer.tsx` as reference
- **Onboarding flow:** Income → categories → assign. Step 1: "How much do you have to budget?" Step 2: Review/customize categories (moderate template, 8-10 groups, ~25 categories). Step 3: Assign with slider UX
- **First month:** Current month, full budget. No partial month logic
- **Offline:** Convex optimistic updates + queue (built-in behavior)

### Default Category Template (~25 categories in 8-10 groups)
- **Housing:** Rent/Mortgage, Home Insurance, Home Maintenance
- **Utilities:** Electric, Water, Internet, Phone
- **Food:** Groceries, Restaurants, Coffee Shops
- **Transportation:** Gas, Car Insurance, Car Maintenance, Public Transit
- **Health:** Health Insurance, Doctor/Pharmacy, Gym/Fitness
- **Entertainment:** Streaming Services, Hobbies, Going Out
- **Shopping:** Clothing, Electronics, Home Goods
- **Financial:** Savings, Emergency Fund, Debt Payments
- **Personal:** Education, Gifts, Personal Care
- **Miscellaneous:** Uncategorized

---

## Data Schema

```
User: id, email, name, currency, onboardingComplete
Account: id, userId, name, type (checking|savings|cash|credit), initialBalance
CategoryGroup: id, userId, name, sortOrder
Category: id, userId, groupId, name, sortOrder, isDefault
Payee: id, userId, name, defaultCategoryId?
Transaction: id, userId, amount (positive), type (expense|transfer), date, payeeId, categoryId?, accountId, notes?, receiptUrl?
BudgetAllocation: id, userId, month (YYYY-MM), categoryId, assignedAmount
IncomeEntry: id, userId, month (YYYY-MM), amount, label?, date
```

**Core math:** `sum(incomeEntries for month) - sum(allocations for month) = ready to assign`

**Category activity:** `sum(transactions where categoryId=X and month=M) = spent for that category`

**Account balance:** `account.initialBalance - sum(expense transactions for account)`

---

## Implementation Phases

### Phase 1: Auth + Onboarding ✅
**Goal:** User can sign up, log in, and complete onboarding wizard

**Scope:**
- Project scaffolding (Next.js, Convex, Tailwind, shadcn)
- Convex schema for all entities (define upfront even if unused yet)
- Better Auth integration via `@convex-dev/better-auth`
- Email/password + Google OAuth
- Onboarding wizard:
  - Step 1: Pick currency
  - Step 2: Add accounts with initial balances
  - Step 3: Set initial income ("How much do you have to budget?")
  - Step 4: Review/customize default category template
  - Step 5: Assign money to categories (slider UX, preview)
- Protected routes (redirect to login if unauthenticated, redirect to onboarding if not complete)
- Mobile-responsive layout shell with bottom tab nav

**Tests (write first):**
- E2E: Full signup → onboarding → land on dashboard flow
- Unit: Budget math (ready to assign calculation)
- Unit: Category template generation

**Deliverable:** User can create account, complete onboarding, and see their budget

---

### Phase 2: Budget Screen + Assignment ✅
**Goal:** Fully functional budget screen with slider-based assignment

**Scope:**
- `/budget` page with category groups and categories
- Slider/progress bar UX for assigning money to categories
- "Ready to assign" banner — updates in real-time as sliders move
- Over-assign allowed with red warning when negative
- Add income entries (button in budget header, tracked with date/amount/label)
- Category CRUD (add, edit, delete → orphans to Uncategorized, reorder via drag)
- Category group CRUD
- Month selector (navigate between months, fresh start each month)
- Convex mutations: createAllocation, updateAllocation, addIncomeEntry
- Convex queries: getBudgetForMonth, getReadyToAssign, getCategoryActivity

**Tests (write first):**
- E2E: Assign money to categories → ready to assign decreases → reaches $0
- E2E: Add income mid-month → ready to assign increases
- E2E: Over-assign → warning shown
- Unit: Allocation mutation logic
- Unit: Ready-to-assign computation with multiple income entries

**Deliverable:** Working budget screen where user can manage income, categories, and allocations

---

### Phase 3: Transactions ✅
**Goal:** Manual transaction management, account views, payee system

**Scope:**
- `/transactions` page — list view with filtering (by date, category, account, payee)
- Manual add/edit/delete transactions
- Transaction form: amount, date, payee (autocomplete from Payee entity), category, account, notes
- Payee entity with auto-learn: after 2+ same payee+category combos, save default mapping. User override updates mapping
- `/accounts` page — list of accounts with computed balances
- Account CRUD (add, edit, delete)
- Transaction affects budget screen activity in real-time (Convex reactivity)
- `/dashboard` page — budget-focused summary widgets (ready to assign, top categories, recent 5 transactions, quick-add button, account balances)

**Tests (write first):**
- E2E: Add transaction → appears in list → budget screen activity updates
- E2E: Add transaction with known payee → category auto-suggested
- E2E: Filter transactions by category/date
- Unit: Account balance computation
- Unit: Payee auto-learn logic (2+ threshold, override updates mapping)

**Deliverable:** Full transaction management with payee intelligence and dashboard

---

### Phase 4: AI Features (NL Entry + Chat) ❌
**Goal:** AI-powered transaction entry and budget chat

**Scope:**
- Next.js API route for NL transaction parsing (`/api/ai/parse-transaction`)
  - Receives natural language text + user's category list + payee list
  - Returns structured transaction (amount, payee, suggested category, date)
  - Always returns to pre-filled form for user confirmation
- Quick-add input on dashboard and transaction page — type "coffee 4.50" → see pre-filled form
- AI chat floating widget (available on all pages)
  - Next.js API route (`/api/ai/chat`) with Vercel AI SDK streaming
  - Session memory (conversation state in React, resets on reload)
  - Tool-calling: 5 core tools using ConvexHttpClient server-side
    - `get_spending_by_category(month)`
    - `get_account_balances()`
    - `get_ready_to_assign()`
    - `get_recent_transactions(n)`
    - `get_category_list()`
  - System prompt with user's currency and current month context

**Tests (write first):**
- E2E: Type "coffee 4.50" → pre-filled form with amount=$4.50, suggested category
- E2E: Open chat → "how much did I spend on groceries?" → correct answer
- Unit: AI response parsing and structured output validation
- Integration: Tool function responses with mock data

**Deliverable:** AI NL entry and conversational budget chat

---

### Phase 5: Receipt Scanning + Polish ❌
**Goal:** Receipt scanning, responsive polish, final integration

**Scope:**
- Receipt upload UI (camera capture on mobile, file upload on desktop)
- Next.js API route for receipt processing (`/api/ai/scan-receipt`)
  - Anthropic vision model extracts: merchant, date, line items (description, amount, category suggestion)
  - Returns list of suggested transactions for user review
  - User confirms/edits each line item → creates multiple transactions (same payee/date/receipt URL)
- Receipt image stored in Convex file storage, URL saved on each transaction
- 30 receipts/month limit — tracked per user per month, error toast at limit
- Mobile responsive polish:
  - Bottom tab nav finalization
  - Budget sliders touch-friendly
  - Transaction list swipe actions (edit/delete)
  - Chat widget mobile-optimized
- Landing page (unauthenticated) — simple pitch + signup CTA
- Error handling pass: toast notifications, loading states, empty states
- Settings page: currency (read-only after onboarding?), account management, category management link

**Tests (write first):**
- E2E: Upload receipt → line items shown → confirm → transactions created
- E2E: Hit receipt limit → error toast shown
- E2E: Full mobile flow via Playwright mobile viewport
- Unit: Receipt parsing response validation
- Unit: Monthly receipt limit tracking

**Deliverable:** Complete MVP with all features from the spec

---

## Verification Strategy

After each phase:
1. Run full test suite: `npx playwright test` + `npm test`
2. Manual smoke test the deployed feature
3. Verify mobile responsiveness (Playwright mobile viewport + manual)
4. Verify Convex real-time reactivity (open two tabs, change data, see both update)

Final integration test after Phase 5:
- Complete E2E flow: signup → onboarding → add income → assign budget → add transactions (manual + NL + receipt) → chat about spending → verify all numbers are consistent
