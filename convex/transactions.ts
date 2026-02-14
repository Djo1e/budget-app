import { v } from "convex/values";
import { query } from "./_generated/server";

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
