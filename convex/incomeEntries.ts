import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByUserMonth = query({
  args: { userId: v.id("userProfiles"), month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incomeEntries")
      .withIndex("by_userId_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    month: v.string(),
    amount: v.number(),
    label: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incomeEntries", args);
  },
});
