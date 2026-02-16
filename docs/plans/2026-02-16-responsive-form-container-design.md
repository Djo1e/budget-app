# Responsive Form Container Design

**Date:** 2026-02-16
**Status:** Approved

## Problem

On mobile, form actions correctly use bottom sheet drawers. On desktop, some forms also use bottom sheet drawers (AccountFormDrawer, TransactionFormDrawer) while others use inline editing (budget assignment). The desired pattern: mobile = bottom drawer, desktop = centered dialog modal.

## Scope

Only multi-field form surfaces change. Lightweight actions (dropdown menus, inline renames, filter bars, swipeable rows) remain unchanged.

**Components in scope:**
- `AccountFormDrawer` — currently uses Sheet for both breakpoints
- `TransactionFormDrawer` — currently uses Sheet for both breakpoints
- `AssignmentDrawer` + `CategoryRow` — mobile uses drawer, desktop uses inline editing

**Out of scope:**
- `AddIncomeDialog` — already a Dialog
- `TransactionFilters` — stays inline on desktop, drawer on mobile
- `CategoryGroupSection` dropdown/inline rename
- Settings inline name editing

## Design

### New: `useIsMobile` hook (`src/hooks/use-mobile.ts`)

Uses `window.matchMedia("(max-width: 767px)")` with a `change` event listener. Returns `boolean`. SSR-safe (defaults to `false`).

### New: `ResponsiveFormContainer` (`src/components/ui/responsive-form-container.tsx`)

Props: `open`, `onOpenChange`, `title`, `description?`, `children`.

- Below `md` breakpoint: renders `Sheet` with `side="bottom"`, `rounded-t-xl`, and `SheetHeader` with title/description
- At `md` and above: renders `Dialog` with `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`

### Changes to existing components

1. **AccountFormDrawer** — Replace Sheet wrapper with ResponsiveFormContainer. Form content (name, type, balance fields + submit button) stays identical.

2. **TransactionFormDrawer** — Replace Sheet wrapper with ResponsiveFormContainer. Form content (amount, date, payee, category, account, notes fields + submit/delete buttons) stays identical.

3. **AssignmentDrawer** — Replace Sheet wrapper with ResponsiveFormContainer. Content (input + slider + done button) stays identical.

4. **CategoryRow** — Remove desktop inline editing (input + slider). Desktop now opens the assignment form via ResponsiveFormContainer (dialog) on click, same as mobile opens the drawer. The `onAssignmentChange` (live preview) and `onAssignmentCommit` (persist) callback pattern remains.

### What stays the same
- All form logic, validation, mutation calls
- Mobile UX (identical bottom sheet drawers)
- Callback patterns (change + commit)
- All non-form action surfaces
