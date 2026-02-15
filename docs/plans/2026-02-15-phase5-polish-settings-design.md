# Phase 5: Polish + Settings — Design

## Settings Page (`/settings`)

- **Profile section:** Display name (editable inline), email (read-only), currency (read-only badge)
- **Navigation links:** "Manage Accounts" → `/accounts`, "Manage Categories" → `/budget`
- **Sign out button** at bottom
- Mobile-responsive card layout, consistent with existing app styling

## Landing Page (`/`)

- Bold single-section hero for unauthenticated users
- Strong headline about zero-based budgeting, 2-3 value prop bullets
- Prominent "Get Started" and "Log In" CTAs
- Authenticated users redirect to `/dashboard` (existing behavior preserved)
- High visual quality — use frontend-design skill

## Transaction Swipe Actions (Mobile)

- Swipe left on transaction row reveals edit/delete action buttons
- CSS transforms + touch event handlers (no external gesture library)
- Mobile only (`<md` breakpoint) — desktop keeps click-to-edit behavior
- Delete requires confirmation before executing

## Error Handling Polish

- Audit all mutations for missing error toasts
- Consistent loading spinners during async operations
- Edge case coverage: empty budget months, no accounts, deleted categories

## E2E Tests

- Settings: profile info renders, navigation links work, sign out
- Mobile: full Playwright mobile viewport through key flows
- Landing: renders for unauthenticated, redirects for authenticated
