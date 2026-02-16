import { mutation } from "../_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const allIncome = await ctx.db.query("incomeEntries").collect();
    if (allIncome.length === 0) return { migrated: 0 };

    const userAccountCache: Record<string, string> = {};
    const userPayeeCache: Record<string, string> = {};

    for (const entry of allIncome) {
      const userId = entry.userId;

      // Get or cache the user's first account
      if (!userAccountCache[userId]) {
        const accounts = await ctx.db
          .query("accounts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
        if (accounts.length === 0) continue;
        userAccountCache[userId] = accounts[0]._id;
      }

      // Get or cache an "Income" payee for this user
      if (!userPayeeCache[userId]) {
        const existingPayees = await ctx.db
          .query("payees")
          .withIndex("by_userId_name", (q) =>
            q.eq("userId", userId).eq("name", "Income")
          )
          .collect();
        if (existingPayees.length > 0) {
          userPayeeCache[userId] = existingPayees[0]._id;
        } else {
          userPayeeCache[userId] = await ctx.db.insert("payees", {
            userId,
            name: "Income",
          });
        }
      }

      await ctx.db.insert("transactions", {
        userId,
        amount: entry.amount,
        type: "income",
        date: entry.date,
        payeeId: userPayeeCache[userId] as any,
        accountId: userAccountCache[userId] as any,
        notes: entry.label || undefined,
      });

      await ctx.db.delete(entry._id);
    }

    return { migrated: allIncome.length };
  },
});
