# AI Intelligence Layer — Design Doc

## Overview

Four AI-first features that transform the budget app from a passive tracker into an active financial assistant. Built incrementally: agentic chat first, then predictions, smart setup, and monthly reviews.

**Key technology:** [json-render](https://json-render.dev) for AI-generated interactive UI components in the chat and reports. Define a catalog of allowed components (forms, tables, charts, buttons, progress bars), and the AI composes them dynamically.

**Model strategy:** Sonnet for complex reasoning (agentic chat, monthly review, smart setup). Haiku for lightweight checks (proactive nudges, spending pace).

---

## Feature 1: Agentic Chat

**Goal:** Upgrade the existing read-only chat to read-write with proactive suggestions.

### Write Tools (5 new tools added to existing 5 read tools)

| Tool | Description | Confirmation UX |
|------|-------------|-----------------|
| `create_transaction` | Creates expense/income transaction | Pre-filled form in chat, user taps Confirm |
| `move_budget_money` | Moves allocation between categories | "Move $X from A → B?" card |
| `set_budget_allocation` | Sets a category's monthly budget | "Set Groceries to $400?" card |
| `add_income` | Creates income transaction | Pre-filled income form |
| `create_category` | Creates new category in a group | "Create 'Pet Supplies' in Shopping?" card |

### Confirmation Model

- **Default:** Every write action shows a confirmation card rendered via json-render
- **Opt-in autonomy:** Users can toggle a setting to skip confirmations for actions under a configurable threshold (e.g., <$20)
- All actions are logged and reversible (undo via chat: "undo that last transaction")

### Proactive Nudges

When the chat opens, AI checks context and may surface dismissable suggestion cards:
- "You've spent 85% of Groceries with 10 days left"
- "You have $200 unassigned — want me to split it across underfunded categories?"
- "3 uncategorized transactions this week — want me to categorize them?"

Nudges appear as cards at the top of the chat panel, not as conversation messages. Tap to act, swipe/X to dismiss.

### Model

- **Agentic chat:** Sonnet (strong tool-calling needed)
- **Nudge generation:** Haiku (lightweight context check)

### json-render Integration

Define a catalog of chat-renderable components:
- `TransactionForm` — pre-filled, editable transaction fields
- `ConfirmationCard` — action description + Confirm/Cancel buttons
- `SuggestionCard` — insight text + action button + dismiss
- `SpendingTable` — category breakdown table
- `MiniChart` — small bar/line chart for trends

The AI generates JSON that maps to these components. Progressive streaming renders them as the response arrives.

---

## Feature 2: Spending Predictions

**Goal:** Mid-month forecasting — tell users if they're on pace to overspend.

### Calculation

Simple pace-based projection (no AI needed for the math):
```
projected = (spent_so_far / days_elapsed) * days_in_month
overspend = projected - allocated
```

Flag when projected overspend > 10% of allocation.

### Where It Surfaces

1. **Budget page:** Pace indicator per category (green/yellow/red dot + projected amount). Tapping opens a json-render forecast card with trend info and suggestion.
2. **Chat nudge:** "At current pace, you'll overspend Groceries by ~$65. Move from Entertainment?"
3. **Chat query:** "Am I on track?" returns a summary of all categories with projections.

### Cold Start

Works from day 1 — even 3 days of data produces useful pace projections. Accuracy improves throughout the month. After 3+ months, could incorporate weekly spending patterns (e.g., grocery spikes on weekends) — deferred to post-MVP.

### Model

Math is computed server-side (Convex query or Next.js API route). AI (Haiku) only used for interpretation and suggestions.

---

## Feature 3: Smart Month Setup

**Goal:** AI generates a recommended budget when starting a new month. One interaction to allocate everything.

### Flow

1. User navigates to a new month with $0 allocated
2. Banner: "Set up [Month]'s budget" with "AI Suggest" button
3. AI analyzes last 1-3 months: allocations, actual spending, income
4. Returns a proposed allocation table via json-render

### AI Logic (Sonnet, one call)

- Underspent categories → suggest lowering
- Overspent categories → suggest raising (with warning)
- Income changes → proportional adjustment
- Total suggestions ≤ available income (leaves small buffer when possible)

### json-render Output

Interactive table: `Category | Last Month Spent | Suggested | [editable input]`

Plus narrative explanation: "Raised Groceries $400→$450 (you averaged $438). Lowered Streaming $50→$30 (spent $28). Total: $2,150 of $2,200 — $50 buffer."

"Apply All" button sets every allocation in one mutation. Users can edit individual amounts before applying.

### Cold Start (Month 1)

Falls back to the onboarding template allocations. After month 1, uses actual data.

---

## Feature 4: Monthly Financial Review

**Goal:** AI-generated personalized financial report at month end.

### Trigger

- Banner on dashboard after month ends
- "Generate Report" button on budget page
- Via chat: "give me my January review"

### Data

All transactions, allocations, income, and account balances for the month. Previous months for comparison when available.

### Report Sections (Sonnet, one call, rendered via json-render)

| Section | Content |
|---------|---------|
| Summary | Total income, spent, saved, net position |
| Category Breakdown | Budget vs. actual table/chart, sorted by biggest variance |
| Wins | Categories under budget, positive trends |
| Attention Areas | Overspent categories, negative trends |
| Month-over-Month | Comparison with prior month (if data exists) |
| Suggestions | 2-3 specific, actionable recommendations |
| Next Month Setup | CTA button linking to Smart Month Setup |

### Shareability

Export a summary card suitable for screenshots: "My [Month] Budget Review: saved 15%, cut dining out by 30%." Drives word-of-mouth.

---

## Implementation Order

1. **Agentic Chat** — extends existing infrastructure, highest immediate impact
2. **Spending Predictions** — mostly math, lightweight AI layer, surfaces via chat and budget page
3. **Smart Month Setup** — needs 1+ months of data, one Sonnet call per setup
4. **Monthly Financial Review** — needs a full month of data, one Sonnet call per report

Each feature is independently deployable and valuable.

---

## Technical Considerations

### json-render Setup

- Install `@json-render/core` and `@json-render/react`
- Define component catalog with Zod schemas (aligns with existing Zod usage)
- Stream JSON from API routes → progressive rendering in chat and report views
- Same catalog serves chat, predictions, setup, and reviews

### API Routes

- Existing: `/api/ai/chat` (upgrade with write tools + json-render)
- Existing: `/api/ai/parse-transaction` (unchanged)
- New: `/api/ai/monthly-review` (generates review report)
- New: `/api/ai/suggest-budget` (generates month setup)
- Spending predictions: computed via Convex query (no AI API route needed for math)

### Schema Changes

- New `aiSettings` field on `userProfiles`: `{ autoConfirmThreshold?: number }` for opt-in autonomy
- No other schema changes needed — all features read existing data

### Cost Estimate (per user per month)

| Feature | Model | Calls/month | Est. cost |
|---------|-------|-------------|-----------|
| Agentic chat | Sonnet | ~30 | ~$0.30 |
| Nudge checks | Haiku | ~60 | ~$0.03 |
| Smart month setup | Sonnet | 1 | ~$0.02 |
| Monthly review | Sonnet | 1 | ~$0.03 |
| **Total** | | | **~$0.38/user/month** |

Well within the "go big" budget and leaves healthy margin on the $5-7/mo price.
