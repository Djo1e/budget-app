import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByUserMonth = query({
  args: { userId: v.id("userProfiles"), month: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return all.filter((t) => t.date.startsWith(args.month));
  },
});

export const listByUser = query({
  args: {
    userId: v.id("userProfiles"),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.categoryId) {
      results = results.filter((t) => t.categoryId === args.categoryId);
    }
    if (args.accountId) {
      results = results.filter((t) => t.accountId === args.accountId);
    }
    if (args.startDate) {
      results = results.filter((t) => t.date >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((t) => t.date <= args.endDate!);
    }

    return results.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const getRecent = query({
  args: { userId: v.id("userProfiles"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, args.limit ?? 5);
  },
});

async function autoLearnCategory(
  ctx: { db: any },
  userId: any,
  payeeId: any
) {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  const payeeTransactions = transactions.filter(
    (t: any) => t.payeeId === payeeId && t.categoryId
  );

  const counts: Record<string, number> = {};
  for (const t of payeeTransactions) {
    counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  }

  let bestCategory: string | null = null;
  let bestCount = 0;
  for (const [catId, count] of Object.entries(counts)) {
    if (count >= 2 && count > bestCount) {
      bestCategory = catId;
      bestCount = count;
    }
  }

  if (bestCategory) {
    await ctx.db.patch(payeeId, { defaultCategoryId: bestCategory });
  }
}

export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    amount: v.number(),
    date: v.string(),
    payeeId: v.id("payees"),
    categoryId: v.optional(v.id("categories")),
    accountId: v.id("accounts"),
    notes: v.optional(v.string()),
    type: v.optional(v.union(v.literal("expense"), v.literal("transfer"), v.literal("income"))),
  },
  handler: async (ctx, args) => {
    const { type: txType, ...rest } = args;
    const id = await ctx.db.insert("transactions", {
      ...rest,
      type: txType ?? "expense",
    });
    if ((txType ?? "expense") === "expense") {
      await autoLearnCategory(ctx, args.userId, args.payeeId);
    }
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.optional(v.number()),
    date: v.optional(v.string()),
    payeeId: v.optional(v.id("payees")),
    categoryId: v.optional(v.id("categories")),
    accountId: v.optional(v.id("accounts")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Transaction not found");
    await ctx.db.patch(id, fields);
    const payeeId = fields.payeeId ?? existing.payeeId;
    await autoLearnCategory(ctx, existing.userId, payeeId);
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
