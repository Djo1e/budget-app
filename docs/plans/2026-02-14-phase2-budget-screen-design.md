# Phase 2: Budget Screen + Assignment — Design

## Overview

Fully functional budget screen at `/budget` with slider+input assignment, real-time ready-to-assign tracking, income entry management, category/group CRUD, and month navigation.

## Page Layout

- **Top bar**: Month selector (prev/next arrows + "February 2026" label) + "Add Income" button
- **Ready-to-assign banner**: Prominent display of available amount. Green when positive, red with warning when negative/over-assigned
- **Category groups**: Collapsible sections showing group name + group total
- **Category rows**: name | editable amount input | slider | activity (spent) | available (assigned - spent)
- **Bottom**: Add category group button

## Interactions

### Assignment
- Click amount to type exact value, or drag slider — both stay in sync
- Saves on blur/slider commit via `budgetAllocations.upsert`
- Ready-to-assign updates in real-time

### Month Navigation
- Arrow buttons for prev/next month
- Each month is independent (no rollover)
- URL param or state-driven (not in URL per existing routing)

### Add Income
- Sheet/dialog with: amount, label (optional), date
- Creates `incomeEntry` for selected month

### Category CRUD
- Add: "+" button in group header opens inline form
- Edit: Click category name to edit inline
- Delete: Context menu, orphans transactions to Uncategorized
- Reorder: Drag-and-drop within group

### Category Group CRUD
- Add: Button at bottom of page
- Edit: Click group name to edit inline
- Delete: Moves categories to Miscellaneous group

## Convex Functions

### New Queries
- `transactions.listByUserMonth` — needed for computing category activity

### New Mutations
- `categories.updateCategory` — rename category
- `categoryGroups.create` — add new group
- `categoryGroups.update` — rename group
- `categoryGroups.remove` — delete group (move categories to Miscellaneous)
- `categories.reorder` — update sortOrder for categories
- `categoryGroups.reorder` — update sortOrder for groups

### Existing (reused)
- `categories.listGroupsByUser` — groups with nested categories
- `budgetAllocations.listByUserMonth` — allocations for month
- `budgetAllocations.upsert` — create/update allocation
- `incomeEntries.listByUserMonth` — income for month
- `incomeEntries.create` — add income entry

## Components

- `BudgetPage` — page container, month state, data fetching
- `ReadyToAssignBanner` — prominent amount display with color coding
- `MonthSelector` — prev/next arrows + month label
- `CategoryGroupSection` — collapsible group with header CRUD + category list
- `CategoryRow` — slider + input + activity/available
- `AddIncomeDialog` — sheet for income entry creation

## Tests

- E2E: Assign money to categories → ready to assign decreases → reaches $0
- E2E: Add income mid-month → ready to assign increases
- E2E: Over-assign → warning shown
- Unit: Allocation mutation logic
- Unit: Ready-to-assign computation with multiple income entries
