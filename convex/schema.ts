import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const accountTypes = v.union(
  v.literal("checking"),
  v.literal("savings"),
  v.literal("cash"),
  v.literal("credit")
);

export const transactionTypes = v.union(
  v.literal("expense"),
  v.literal("transfer")
);

export default defineSchema({
  userProfiles: defineTable({
    betterAuthUserId: v.string(),
    email: v.string(),
    name: v.string(),
    currency: v.string(),
    onboardingComplete: v.boolean(),
  })
    .index("by_betterAuthUserId", ["betterAuthUserId"])
    .index("by_email", ["email"]),

  accounts: defineTable({
    userId: v.id("userProfiles"),
    name: v.string(),
    type: accountTypes,
    initialBalance: v.number(),
  }).index("by_userId", ["userId"]),

  categoryGroups: defineTable({
    userId: v.id("userProfiles"),
    name: v.string(),
    sortOrder: v.number(),
  }).index("by_userId", ["userId"]),

  categories: defineTable({
    userId: v.id("userProfiles"),
    groupId: v.id("categoryGroups"),
    name: v.string(),
    sortOrder: v.number(),
    isDefault: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_groupId", ["groupId"]),

  payees: defineTable({
    userId: v.id("userProfiles"),
    name: v.string(),
    defaultCategoryId: v.optional(v.id("categories")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_name", ["userId", "name"]),

  transactions: defineTable({
    userId: v.id("userProfiles"),
    amount: v.number(),
    type: transactionTypes,
    date: v.string(),
    payeeId: v.id("payees"),
    categoryId: v.optional(v.id("categories")),
    accountId: v.id("accounts"),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_userId_date", ["userId", "date"]),

  budgetAllocations: defineTable({
    userId: v.id("userProfiles"),
    month: v.string(),
    categoryId: v.id("categories"),
    assignedAmount: v.number(),
  })
    .index("by_userId_month", ["userId", "month"])
    .index("by_categoryId_month", ["categoryId", "month"]),

  incomeEntries: defineTable({
    userId: v.id("userProfiles"),
    month: v.string(),
    amount: v.number(),
    label: v.optional(v.string()),
    date: v.string(),
  }).index("by_userId_month", ["userId", "month"]),
});
