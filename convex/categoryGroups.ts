import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    name: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categoryGroups", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("categoryGroups"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { name: args.name });
  },
});

export const remove = mutation({
  args: {
    id: v.id("categoryGroups"),
    userId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const allGroups = await ctx.db
      .query("categoryGroups")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const miscGroup = allGroups.find((g) => g.name === "Miscellaneous");
    if (!miscGroup) throw new Error("Miscellaneous group not found");
    if (miscGroup._id === args.id) throw new Error("Cannot delete Miscellaneous group");

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();
    for (const cat of categories) {
      await ctx.db.patch(cat._id, { groupId: miscGroup._id });
    }

    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("categoryGroups"),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, { sortOrder: update.sortOrder });
    }
  },
});
