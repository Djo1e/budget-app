import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { accountTypes } from "./schema";

export const listByUser = query({
  args: { userId: v.id("userProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("userProfiles"),
    name: v.string(),
    type: accountTypes,
    initialBalance: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.string(),
    type: accountTypes,
    initialBalance: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
