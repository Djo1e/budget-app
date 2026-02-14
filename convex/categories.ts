import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listGroupsByUser = query({
  args: { userId: v.id("userProfiles") },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("categoryGroups")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const groupsWithCategories = await Promise.all(
      groups.map(async (group) => {
        const categories = await ctx.db
          .query("categories")
          .withIndex("by_groupId", (q) => q.eq("groupId", group._id))
          .collect();
        return {
          ...group,
          categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
        };
      })
    );

    return groupsWithCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const createDefaultTemplate = mutation({
  args: {
    userId: v.id("userProfiles"),
    template: v.array(
      v.object({
        name: v.string(),
        sortOrder: v.number(),
        categories: v.array(
          v.object({
            name: v.string(),
            sortOrder: v.number(),
            isDefault: v.boolean(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const group of args.template) {
      const groupId = await ctx.db.insert("categoryGroups", {
        userId: args.userId,
        name: group.name,
        sortOrder: group.sortOrder,
      });

      for (const cat of group.categories) {
        await ctx.db.insert("categories", {
          userId: args.userId,
          groupId,
          name: cat.name,
          sortOrder: cat.sortOrder,
          isDefault: cat.isDefault,
        });
      }
    }
  },
});

export const removeCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addCategory = mutation({
  args: {
    userId: v.id("userProfiles"),
    groupId: v.id("categoryGroups"),
    name: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      ...args,
      isDefault: false,
    });
  },
});
