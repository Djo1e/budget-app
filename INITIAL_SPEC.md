# Budget App — Initial Specification

## Product vision

A simplified, AI-first, zero-based budgeting app. Cheaper and easier than YNAB, targeting beginners and users who found YNAB too complex or expensive. Open source with a hosted paid version.

## Target user

- People new to budgeting or who tried YNAB and bounced off
- Don't want to learn a system or watch tutorials
- Want to set up in 5 minutes and start tracking
- Appreciate AI handling the tedious parts

## Business model

- **Open source** — full codebase on GitHub, self-hosters bring their own API keys and infrastructure
- **Hosted version** — $4.99-6.99/mo, dead simple signup, AI costs baked into subscription
- Self-hosting is "technically possible" but not a first-class priority
- Bank connections (Plaid) as a potential future premium feature
- Also serves as a portfolio/resume project if it doesn't take off commercially

## Core features (MVP — 1 week)

### 1. Auth

- Better Auth
- Email/password + Google OAuth

### 2. Onboarding wizard

- Pick currency (all major currencies supported, one currency per user, auto-conversion if foreign currency entered)
- Add accounts with current balances
- Create category groups/categories from a sensible default template
- Guided "assign every dollar" step with progress toward $0 remaining

### 3. Budget screen

- Category groups and categories
- Assigned amount per category
- Spent/activity per category
- "Ready to assign" banner prominently displayed
- Game-like UX for assigning money — not a spreadsheet grid

### 4. Transactions

- List view with filtering
- Manual add/edit/delete
- Each transaction: amount, date, payee, category, account

### 5. AI natural language transaction entry

- User types "coffee 4.50" or "spent $45 at Whole Foods"
- AI parses amount, payee, suggests category
- Learns from user's history over time

### 6. AI budget chat

- Conversational interface for querying budget data
- "How much did I spend on groceries this month?"
- "Am I on track this month?"
- "What's my biggest expense category?"
- Forecasting and spending trends

### 7. Receipt scanning

- User uploads/photographs a receipt
- Vision model extracts merchant, amount, date, line items
- Auto-creates transaction with suggested category

### 8. Responsive design

- Usable on mobile browsers
- No native app in MVP

## Post-MVP priority order

1. Monthly rollover logic
2. Basic reports (spending by category over time)
3. Recurring transactions
4. Expo native mobile app
5. CSV import
6. Bank connections (Plaid, premium feature)
7. Multi-user / household support
8. Offline support

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js** | Web app, SSR, API routes |
| Database + backend | **Convex** | Real-time, fast DX, optimistic updates, generated types, no migrations. Tradeoff: vendor lock-in, weak self-host story — acceptable given priorities |
| Auth | **Better Auth** | Self-host friendly, many providers, works with Next.js |
| Server state | **TanStack Query** | Works on web and React Native, caching/invalidation |
| AI | **Anthropic via Vercel AI SDK (`ai` npm package)** | Streaming, tool calling, structured output. Hosted version uses project keys, self-hosters bring their own |
| Validation | **Zod** | Shared schemas, AI structured output, form validation |
| CSS | **Tailwind + shadcn/ui** | Rapid UI development, consistent design system |
| E2E tests | **Playwright** | Browser automation, full user flow testing |
| Component tests | **React Testing Library** | Component behavior testing |

## Architecture

- **Single Next.js repo** — no monorepo, no turborepo. Simple for solo 1-week sprint.
- Convex handles all backend logic, real-time sync, and data storage. Next.js serves the frontend and API routes for AI endpoints (streaming).
- When Expo app is built later, it calls the same Convex backend directly. Shared code (zod schemas, currency utils, constants) extracted into npm package or copied if minimal.
- AI features go through Next.js API routes (for streaming via Vercel AI SDK) which call Convex for data context.

## Data model

| Entity | Fields |
|---|---|
| **User** | id, email, name, currency, onboarding status |
| **Account** | id, user, name, type (checking/savings/cash/etc.), balance |
| **Category group** | id, user, name, sort order |
| **Category** | id, user, group, name, sort order |
| **Transaction** | id, user, amount, date, payee, category, account, notes, receipt URL |
| **Budget allocation** | id, user, month (YYYY-MM), category, assigned amount |

**Core math:** income - sum(allocations) = "ready to assign"

## Key UX decisions

- **No budgeting philosophy/education** — purely tool-focused
- **Onboarding:** quick wizard, not a tutorial. Possibly a short video demo of key features
- **Budget assignment:** guided, progress-bar style toward $0 remaining — approachable, not intimidating
- **Manual entry by design:** framed as "intentional budgeting." AI natural language entry + receipt scanning remove the friction so it's nearly as fast as bank sync
- **Single currency per user** with auto-conversion for foreign amounts
- **No credit card payment tracking** (YNAB's most confusing feature — intentionally omitted)

## Development approach — TDD with agentic feedback loop

1. **Write tests first** — tests serve as the specification
2. **Agent implements** — writes code until tests pass
3. **Tests as guardrails** — catch regressions as features are added rapidly

### Test structure

- `e2e/` — Playwright tests for critical user flows
- Colocated `.test.tsx` files — component and unit tests with React Testing Library
- CI runs both suites

### Key E2E test flows (write these first)

1. Sign up → onboarding wizard → land on budget screen with categories and "ready to assign"
2. Add transaction manually → appears in transaction list → budget screen updates
3. AI natural language entry → "coffee 4.50" → transaction created with correct amount and category
4. Upload receipt photo → transaction auto-populated with extracted data
5. Open AI chat → "how much did I spend this month?" → correct answer returned
6. Assign money to categories → "ready to assign" decreases → reaches $0

## Name

TBD — top candidates: **Budgie**, **Centsible**
