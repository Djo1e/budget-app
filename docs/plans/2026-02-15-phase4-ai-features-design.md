# Phase 4 Design: AI Features (NL Entry + Chat)

## Overview

Add two AI-powered features: natural language transaction entry and a budget chat widget. Both use Anthropic via Vercel AI SDK, called from Next.js API routes.

## Dependencies

- `ai` (Vercel AI SDK) — streaming, tool-calling, useChat hook
- `@ai-sdk/anthropic` — Anthropic provider

## API Routes

### POST /api/ai/parse-transaction

Parses natural language into structured transaction data.

- **Input:** `{ text: string, categories: {id, name}[], payees: {id, name}[] }`
- **Output:** `{ amount: number, payeeName: string, categoryId?: string, date: string }`
- **Auth:** Validate session via Better Auth server helpers
- **Model:** Claude (small/fast model — haiku or sonnet)
- **No streaming** — simple JSON response

### POST /api/ai/chat

Streaming chat with tool-calling for budget queries.

- **Uses:** `streamText` from Vercel AI SDK
- **Auth:** Validate session, fetch user profile for currency/context
- **System prompt:** User's currency, current month (YYYY-MM), instructions to be helpful budget assistant
- **Tools (5):**
  1. `get_spending_by_category(month)` — transactions grouped by category with totals
  2. `get_account_balances()` — all accounts with computed balances
  3. `get_ready_to_assign()` — income minus allocations for month
  4. `get_recent_transactions(n)` — last N transactions with details
  5. `get_category_list()` — category groups with nested categories
- **Server-side data access:** ConvexHttpClient with user's identity

## UI Components

### NL Quick-Add Input

Text input with AI icon on Dashboard and Transactions pages. Type natural language, hit enter, calls parse API, opens TransactionFormDrawer pre-filled. Graceful fallback: if parsing fails, opens empty form with error toast.

### Chat Widget

- Floating bubble bottom-right (above mobile bottom nav)
- Click opens chat panel with message history
- Uses `useChat` hook from Vercel AI SDK for streaming
- Session memory in React state (resets on reload)
- Tool results shown inline
- Mounted at layout level so it persists across navigation
- Dismissible

## Data Flow

```
NL Entry:
  User types "coffee 4.50" → POST /api/ai/parse-transaction
  → { amount: 4.50, payeeName: "Coffee", categoryId: "..." }
  → Pre-fill TransactionFormDrawer → User confirms → createTx mutation

Chat:
  User asks question → POST /api/ai/chat (streaming)
  → Claude decides to call tool → ConvexHttpClient fetches from Convex
  → Tool result fed back to Claude → Streams natural language answer
```

## Testing

- E2E: NL entry "coffee 4.50" → pre-filled form with $4.50
- E2E: Chat "how much did I spend on groceries?" → correct answer
- Unit: Parse response validation (Zod schemas)
- Integration: Tool functions return correct data from mock Convex
