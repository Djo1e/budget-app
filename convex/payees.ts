import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByUser = query({
  args: { userId: v.id("userProfiles") },
  handler: async (ctx, args) => {
    const payees = await ctx.db
      .query("payees")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return payees.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getOrCreate = mutation({
  args: { userId: v.id("userProfiles"), name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payees")
      .withIndex("by_userId_name", (q) =>
        q.eq("userId", args.userId).eq("name", args.name)
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("payees", {
      userId: args.userId,
      name: args.name,
    });
  },
});

export const updateDefaultCategory = mutation({
  args: { id: v.id("payees"), categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { defaultCategoryId: args.categoryId });
  },
});
