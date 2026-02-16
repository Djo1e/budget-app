# Onboarding Account Creation Step

## Summary

Add an optional account creation step as the final step in the onboarding flow, before finishing. Users can add multiple accounts (checking, savings, cash, credit) with initial balances, or skip to add them later.

## Position in Flow

Name → lifestyle questions (household, home, transport, debt, spending, subscriptions, expenses, goals, fun) → **Accounts** → Done

## Step UI (`StepAccounts`)

Uses `OnboardingStepLayout` with emoji "🏦" and title "Add your accounts".

### Inline form

- Name input (text, placeholder "e.g. Main Checking")
- Type select (Checking / Savings / Cash / Credit)
- Initial Balance input (number, placeholder "0.00")
- "Add Account" button

### Added accounts list

Below the form, each added account shown as a compact card with name, type badge, formatted balance, and an X remove button.

### Footer

- Skip text: "Skip for now — you can add accounts later"
- Back button → last lifestyle step
- Finish button → completes onboarding

## Data Flow

- Accounts held in local state as `Array<{ name, type, initialBalance }>`
- On finish: create profile → create categories → create each account → complete onboarding → redirect
- If skipped (0 accounts): normal finish, no accounts created

## No Schema Changes

Existing `accounts.create` mutation and schema handle everything.
