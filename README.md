# Budget App

An open-source, AI-first, zero-based budgeting app. Simple, self-hostable, and free.

## Features

- **Zero-based budgeting** — every dollar gets a job. Assign income to categories with slider-based controls
- **Real-time sync** — powered by Convex, all changes sync instantly across tabs and devices
- **AI transaction entry** — type "coffee 4.50" and get a pre-filled transaction form
- **AI budget chat** — floating chat widget on every page to ask questions about your spending
- **Smart payees** — auto-learns category mappings after 2+ transactions with the same payee
- **Multi-account support** — checking, savings, cash, and credit accounts with computed balances
- **Guided onboarding** — step-by-step setup: currency, accounts, income, categories, and initial budget assignment
- **Mobile-friendly** — responsive design with bottom sheet drawers on mobile, dialogs on desktop

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **Backend:** Convex (real-time database, file storage)
- **Auth:** Better Auth via `@convex-dev/better-auth`
- **AI:** Anthropic Claude via Vercel AI SDK
- **Testing:** Vitest (unit) + Playwright (E2E)

## Self-Hosting

### Prerequisites

- Node.js 18+
- A [Convex](https://www.convex.dev/) account (free tier available)
- An [Anthropic](https://console.anthropic.com/) API key (for AI features)

### 1. Clone and install

```bash
git clone https://github.com/your-username/budget-app.git
cd budget-app
npm install
```

### 2. Set up Convex

Create a new Convex project and link it:

```bash
npx convex dev --once
```

This will prompt you to log in and create a project. It generates a `.env.local` file with:

```
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-name.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment-name.convex.site
```

### 3. Configure environment variables

Set the required Convex environment variables:

```bash
npx convex env set BETTER_AUTH_SECRET "your-random-secret-string"
npx convex env set SITE_URL "http://localhost:3000"
```

For AI features, add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 4. Run the app

You need two terminals running simultaneously:

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

For production, deploy the frontend to any platform that supports Next.js (Vercel, Netlify, etc.) and use Convex Cloud for the backend.

1. Deploy Convex to production:
   ```bash
   npx convex deploy
   ```

2. Update the `SITE_URL` Convex environment variable to your production URL:
   ```bash
   npx convex env set SITE_URL "https://your-domain.com"
   ```

3. Set your production environment variables on your hosting platform:
   - `CONVEX_DEPLOYMENT` — your production Convex deployment
   - `NEXT_PUBLIC_CONVEX_URL` — your production Convex URL
   - `NEXT_PUBLIC_CONVEX_SITE_URL` — your production Convex site URL
   - `ANTHROPIC_API_KEY` — your Anthropic API key

## Development

```bash
npm run dev              # Start Next.js dev server
npx convex dev           # Start Convex dev server (run alongside Next.js)
npm test                 # Run unit tests
npm run test:watch       # Run unit tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)
npx tsc --noEmit         # TypeScript type check
```

## Project Structure

```
src/
  app/
    (auth)/              # Login, signup pages
    (app)/               # Protected app pages
      dashboard/         # Budget summary, quick actions
      budget/            # Category assignment with sliders
      transactions/      # Transaction list with filters
      accounts/          # Account management
      settings/          # User settings
    onboarding/          # 5-step setup wizard
    api/                 # Auth + AI API routes
  components/ui/         # shadcn/ui components
  lib/                   # Auth clients, budget math, utilities
convex/
  schema.ts              # Database schema
  users.ts               # User profile functions
  accounts.ts            # Account CRUD
  categories.ts          # Category/group CRUD
  transactions.ts        # Transaction CRUD
  budgetAllocations.ts   # Budget assignment functions
  incomeEntries.ts       # Income entry functions
```

## License

MIT
