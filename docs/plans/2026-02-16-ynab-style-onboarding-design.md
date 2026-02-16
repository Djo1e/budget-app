# YNAB-Style Onboarding Redesign

## Overview

Replace the current 5-step onboarding (Currency → Accounts → Income → Categories → Assign) with a YNAB-inspired lifestyle questionnaire. Users answer ~10 questions about their life, and their selections determine which budget categories get created. Accounts, income, and budget assignment are deferred to post-onboarding on the dashboard.

## Flow

All steps use centered card layout (max-width ~600px) with a blue progress bar at the top of the page.

### Steps

1. **Welcome / Name** — "Let's get started." First name input.
2. **Household** — "Who's in your household?" Multi-select: Myself, My partner, Kids, Teens, Other adults, Pets
3. **Home** — "Tell us about your home" Single-select: I rent, I own, Other
4. **Transportation** — "How do you get around?" Multi-select: Car, Rideshare, Bike, Motorcycle, Walk, Public transit. Skip: "None of these apply to me"
5. **Debt** — "Do you currently have any debt?" Multi-select: Credit card, Medical debt, Auto loans, Buy now pay later, Student loans, Personal loans. Skip: "I don't currently have debt"
6. **Regular spending** — "Which of these do you regularly spend money on?" Multi-select: Groceries, TV/phone/internet, Personal care, Clothing, Self storage. Skip: "None of these apply to me"
7. **Subscriptions** — "Which of these subscriptions do you have?" Multi-select: Music, TV streaming, Fitness, Other subscriptions. Skip: "I don't subscribe to any of these"
8. **Less frequent expenses** — "What less frequent expenses do you need to prepare for?" Multi-select: Annual credit card fees, Medical expenses, Taxes or other fees. Skip: "None of these apply to me"
9. **Goals** — "What goals do you want to prioritize?" Multi-select: Dream vacation, New baby, New car, Emergency fund, New home, Retirement or investments, Wedding. Skip: "I don't save for any of these"
10. **Fun spending** — "What else do you want to include in your plan?" Multi-select: Dining out, Holidays & gifts, Entertainment, Decor & garden, Hobbies, My spending money, Charity, Their spending money (if partner selected). Last step — "Finish" button.

### Category Mapping

Each selection maps to categories within groups:

| Selection | Category Group | Categories |
|-----------|---------------|------------|
| Partner | Personal | Their spending money |
| Kids/Teens | Family | Kids activities, School supplies |
| Pets | Family | Pet care |
| Rent | Housing | Rent, Renters insurance |
| Own | Housing | Mortgage, Home insurance, Property taxes, Home maintenance |
| Other (home) | Housing | Housing |
| Car | Transportation | Gas/Fuel, Car insurance, Car maintenance |
| Rideshare | Transportation | Rideshare |
| Bike | Transportation | Bike maintenance |
| Public transit | Transportation | Public transit |
| Credit card debt | Debt | Credit card payments |
| Auto loans | Debt | Auto loan payments |
| Student loans | Debt | Student loan payments |
| Medical debt | Debt | Medical debt payments |
| Personal loans | Debt | Personal loan payments |
| BNPL | Debt | Buy now pay later |
| Groceries | Food | Groceries |
| TV/phone/internet | Utilities | TV/Phone/Internet |
| Personal care | Personal | Personal care |
| Clothing | Shopping | Clothing |
| Self storage | Housing | Self storage |
| Music sub | Subscriptions | Music |
| TV streaming sub | Subscriptions | TV streaming |
| Fitness sub | Subscriptions | Fitness |
| Other subs | Subscriptions | Other subscriptions |
| CC fees | Less Frequent | Annual credit card fees |
| Medical expenses | Less Frequent | Medical expenses |
| Taxes/fees | Less Frequent | Taxes or fees |
| Each goal | Savings Goals | (matching category name) |
| Dining out | Food | Dining out |
| Holidays & gifts | Personal | Holidays & gifts |
| Entertainment | Entertainment | Entertainment |
| Decor & garden | Home | Decor & garden |
| Hobbies | Entertainment | Hobbies |
| My spending money | Personal | My spending money |
| Charity | Personal | Charity |

**Always created:** Miscellaneous group with Uncategorized category.

## UI Design

- **Progress bar**: Blue bar at very top, fills proportionally (step/totalSteps)
- **Card**: Centered, max-width ~600px, white card with padding
- **Title**: Bold heading centered, emoji prefix per step
- **Options**: Rounded rectangles, 2-column grid (many items) or 1-column (few items). Light gray bg, selected = blue/purple with checkmark
- **Skip links**: Centered muted blue text link below options
- **Navigation**: Back + Next/Finish buttons bottom-right. Back hidden on step 1. Next disabled until selection made (unless skip link exists)

## Backend Changes

- `users.createProfile()` defaults currency to "USD"
- New Convex mutation: `categories.createFromOnboardingSelections()` — takes collected selections object, creates groups + categories in one batch
- Keep `users.completeOnboarding()`
- Remove old `createDefaultTemplate` from onboarding flow

## Data Flow

1. All steps store selections in React state (no backend calls during questionnaire)
2. On "Finish": createProfile → createFromOnboardingSelections → completeOnboarding
3. Redirect to `/dashboard`
