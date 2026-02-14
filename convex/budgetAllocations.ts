import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByUserMonth = query({
  args: { userId: v.id("userProfiles"), month: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgetAllocations")
      .withIndex("by_userId_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .collect();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("userProfiles"),
    month: v.string(),
    categoryId: v.id("categories"),
    assignedAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetAllocations")
      .withIndex("by_categoryId_month", (q) =>
        q.eq("categoryId", args.categoryId).eq("month", args.month)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        assignedAmount: args.assignedAmount,
      });
      return existing._id;
    }

    return await ctx.db.insert("budgetAllocations", args);
  },
});
