import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import { isAuthenticated, fetchAuthQuery, fetchAuthMutation } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { formatSpendingByCategory, formatAccountBalances, buildBudgetContext } from "@/lib/ai/chat-tools";
import { predictCategorySpending, getDayOfMonth, getDaysInMonth } from "@/lib/spending-predictions";

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) {
    return new Response("Profile not found", { status: 404 });
  }

  const userId = userProfile._id;
  const currency = userProfile.currency;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  // Fetch data for the system prompt context
  const [groups, accounts, payees] = await Promise.all([
    fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
    fetchAuthQuery(api.accounts.listByUser, { userId }),
    fetchAuthQuery(api.payees.listByUser, { userId }),
  ]);

  const categories: { id: string; name: string; groupName: string }[] = [];
  for (const g of groups as { name: string; categories: { _id: string; name: string }[] }[]) {
    for (const c of g.categories) {
      categories.push({ id: c._id, name: c.name, groupName: g.name });
    }
  }

  const budgetContext = buildBudgetContext({
    categories,
    accounts: (accounts as { _id: string; name: string; type: string }[]).map((a) => ({
      id: a._id,
      name: a.name,
      type: a.type,
    })),
    payees: (payees as { _id: string; name: string }[]).map((p) => ({
      id: p._id,
      name: p.name,
    })),
  });

  const systemPrompt = [
    `You are a budget assistant with FULL read and write access to the user's budget. The user's currency is ${currency}. The current month is ${currentMonth}.`,
    "",
    "CAPABILITIES: You can create transactions, move money between budget categories, set budget allocations, add income, create categories, and query all budget data. USE YOUR TOOLS when the user asks you to do these things. Do not say you cannot do something if you have a tool for it.",
    "",
    "STYLE: Be concise. Skip preamble — never start with \"I'll check...\" or \"Let me look up...\" or similar filler. Jump straight to the answer or action. Format currency amounts with the user's currency symbol.",
    "",
    budgetContext,
  ].join("\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    maxOutputTokens: 2000,
    tools: {
      // ---- Read tools ----
      get_spending_by_category: tool({
        description: "Get spending totals grouped by category for a given month",
        inputSchema: z.object({
          month: z.string().describe("Month in YYYY-MM format"),
        }),
        execute: async ({ month }) => {
          const transactions = await fetchAuthQuery(api.transactions.listByUserMonth, {
            userId,
            month,
          });
          const categoryMap: Record<string, string> = {};
          for (const g of groups as { categories: { _id: string; name: string }[] }[]) {
            for (const c of g.categories) {
              categoryMap[c._id] = c.name;
            }
          }
          return formatSpendingByCategory(transactions as { amount: number; categoryId?: string; date: string; type: string }[], categoryMap, month);
        },
      }),
      get_account_balances: tool({
        description: "Get all account balances",
        inputSchema: z.object({}),
        execute: async () => {
          const transactions = await fetchAuthQuery(api.transactions.listByUser, { userId });
          return formatAccountBalances(
            accounts as { name: string; initialBalance: number; _id: string; type: string }[],
            transactions as { amount: number; accountId: string; type: string }[]
          );
        },
      }),
      get_ready_to_assign: tool({
        description: "Get the ready-to-assign amount for a month",
        inputSchema: z.object({
          month: z.string().describe("Month in YYYY-MM format"),
        }),
        execute: async ({ month }) => {
          const transactions = await fetchAuthQuery(api.transactions.listByUserMonth, {
            userId,
            month,
          });
          const allocations = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, {
            userId,
            month,
          });
          const totalIncome = (transactions as { amount: number; type: string }[])
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0);
          const totalAllocated = (allocations as { assignedAmount: number }[]).reduce(
            (s, a) => s + a.assignedAmount,
            0
          );
          return `Ready to assign for ${month}: $${(totalIncome - totalAllocated).toFixed(2)} (Income: $${totalIncome.toFixed(2)}, Allocated: $${totalAllocated.toFixed(2)})`;
        },
      }),
      get_recent_transactions: tool({
        description: "Get the most recent transactions",
        inputSchema: z.object({
          count: z.number().default(5).describe("Number of transactions to retrieve"),
        }),
        execute: async ({ count }) => {
          const transactions = await fetchAuthQuery(api.transactions.getRecent, {
            userId,
            limit: count,
          });
          const payeeMap: Record<string, string> = {};
          for (const p of payees as { _id: string; name: string }[]) payeeMap[p._id] = p.name;

          if (transactions.length === 0) return "No recent transactions.";
          const lines = (transactions as { date: string; payeeId: string; amount: number }[]).map(
            (t) =>
              `- ${t.date}: ${payeeMap[t.payeeId] ?? "Unknown"} — $${t.amount.toFixed(2)}`
          );
          return `Recent transactions:\n${lines.join("\n")}`;
        },
      }),
      get_category_list: tool({
        description: "Get all budget categories organized by group",
        inputSchema: z.object({}),
        execute: async () => {
          if ((groups as { name: string; categories: { name: string }[] }[]).length === 0) return "No categories set up.";
          const lines = (groups as { name: string; categories: { name: string }[] }[]).map(
            (g) =>
              `${g.name}: ${g.categories.map((c) => c.name).join(", ")}`
          );
          return lines.join("\n");
        },
      }),

      get_spending_predictions: tool({
        description: "Get spending pace predictions for the current month — shows which categories are on track to overspend",
        inputSchema: z.object({
          month: z.string().describe("Month in YYYY-MM format"),
        }),
        execute: async ({ month }) => {
          const txs = await fetchAuthQuery(api.transactions.listByUserMonth, { userId, month });
          const allocs = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month });
          const categoryMap: Record<string, string> = {};
          for (const g of groups as { categories: { _id: string; name: string }[] }[]) {
            for (const c of g.categories) categoryMap[c._id] = c.name;
          }
          const allocMap: Record<string, number> = {};
          for (const a of allocs as { categoryId: string; assignedAmount: number }[]) allocMap[a.categoryId] = a.assignedAmount;

          const dayOfMonth = getDayOfMonth(month);
          const daysInMonth = getDaysInMonth(month);

          const predictions: string[] = [];
          for (const [catId, catName] of Object.entries(categoryMap)) {
            const spent = (txs as { categoryId?: string; type: string; amount: number }[])
              .filter((t) => t.categoryId === catId && t.type === "expense")
              .reduce((s, t) => s + t.amount, 0);
            const allocated = allocMap[catId] ?? 0;
            if (spent === 0 && allocated === 0) continue;
            const pred = predictCategorySpending({ spent, allocated, dayOfMonth, daysInMonth });
            predictions.push(
              `${catName}: spent $${spent.toFixed(2)} of $${allocated.toFixed(2)}, projected $${pred.projected.toFixed(2)} (${pred.status})`
            );
          }
          return predictions.length > 0 ? predictions.join("\n") : "No spending data for this month.";
        },
      }),

      // ---- Write tools ----
      create_transaction: tool({
        description: "Create a new expense or income transaction",
        inputSchema: z.object({
          amount: z.number(),
          payeeName: z.string(),
          categoryName: z.string().optional(),
          accountName: z.string().optional(),
          date: z.string().optional(),
          type: z.enum(["expense", "income"]).optional(),
        }),
        execute: async ({ amount, payeeName, categoryName, accountName, date, type }) => {
          const payeeId = await fetchAuthMutation(api.payees.getOrCreate, {
            userId,
            name: payeeName,
          });
          let categoryId: string | undefined;
          if (categoryName) {
            for (const g of groups as { categories: { _id: string; name: string }[] }[]) {
              const match = g.categories.find(
                (c) => c.name.toLowerCase() === categoryName.toLowerCase()
              );
              if (match) { categoryId = match._id; break; }
            }
          }
          let accountId = (accounts as { _id: string }[])[0]?._id;
          if (accountName) {
            const match = (accounts as { _id: string; name: string }[]).find(
              (a) => a.name.toLowerCase() === accountName.toLowerCase()
            );
            if (match) accountId = match._id;
          }
          if (!accountId) return "No accounts found. User needs to create an account first.";
          await fetchAuthMutation(api.transactions.create, {
            userId,
            amount,
            date: date ?? new Date().toISOString().slice(0, 10),
            payeeId: payeeId as any,
            categoryId: categoryId as any,
            accountId: accountId as any,
            type: type ?? "expense",
          });
          return `Transaction created: $${amount.toFixed(2)} at ${payeeName}`;
        },
      }),
      move_budget_money: tool({
        description: "Move budget allocation from one category to another for a given month",
        inputSchema: z.object({
          fromCategoryName: z.string(),
          toCategoryName: z.string(),
          amount: z.number(),
          month: z.string().optional(),
        }),
        execute: async ({ fromCategoryName, toCategoryName, amount, month: m }) => {
          const targetMonth = m ?? currentMonth;
          let fromId: string | undefined, toId: string | undefined;
          for (const g of groups as { categories: { _id: string; name: string }[] }[]) {
            for (const c of g.categories) {
              if (c.name.toLowerCase() === fromCategoryName.toLowerCase()) fromId = c._id;
              if (c.name.toLowerCase() === toCategoryName.toLowerCase()) toId = c._id;
            }
          }
          if (!fromId || !toId) return `Could not find categories "${fromCategoryName}" and/or "${toCategoryName}".`;
          const allocs = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month: targetMonth });
          const fromAlloc = (allocs as { categoryId: string; assignedAmount: number }[]).find((a) => a.categoryId === fromId);
          const toAlloc = (allocs as { categoryId: string; assignedAmount: number }[]).find((a) => a.categoryId === toId);
          const fromAmount = fromAlloc?.assignedAmount ?? 0;
          const toAmount = toAlloc?.assignedAmount ?? 0;
          await fetchAuthMutation(api.budgetAllocations.upsert, {
            userId, month: targetMonth, categoryId: fromId as any, assignedAmount: fromAmount - amount,
          });
          await fetchAuthMutation(api.budgetAllocations.upsert, {
            userId, month: targetMonth, categoryId: toId as any, assignedAmount: toAmount + amount,
          });
          return `Moved $${amount.toFixed(2)} from ${fromCategoryName} to ${toCategoryName} for ${targetMonth}.`;
        },
      }),
      set_budget_allocation: tool({
        description: "Set a category's budget allocation for a month",
        inputSchema: z.object({
          categoryName: z.string(),
          amount: z.number(),
          month: z.string().optional(),
        }),
        execute: async ({ categoryName, amount, month: m }) => {
          const targetMonth = m ?? currentMonth;
          let catId: string | undefined;
          for (const g of groups as { categories: { _id: string; name: string }[] }[]) {
            const match = g.categories.find(
              (c) => c.name.toLowerCase() === categoryName.toLowerCase()
            );
            if (match) { catId = match._id; break; }
          }
          if (!catId) return `Category "${categoryName}" not found.`;
          await fetchAuthMutation(api.budgetAllocations.upsert, {
            userId, month: targetMonth, categoryId: catId as any, assignedAmount: amount,
          });
          return `Set ${categoryName} budget to $${amount.toFixed(2)} for ${targetMonth}.`;
        },
      }),
      add_income: tool({
        description: "Add an income transaction",
        inputSchema: z.object({
          amount: z.number(),
          label: z.string().optional(),
          accountName: z.string().optional(),
          date: z.string().optional(),
        }),
        execute: async ({ amount, label, accountName, date }) => {
          let accountId = (accounts as { _id: string }[])[0]?._id;
          if (accountName) {
            const match = (accounts as { _id: string; name: string }[]).find(
              (a) => a.name.toLowerCase() === accountName.toLowerCase()
            );
            if (match) accountId = match._id;
          }
          if (!accountId) return "No accounts found.";
          const payeeId = await fetchAuthMutation(api.payees.getOrCreate, {
            userId, name: label ?? "Income",
          });
          await fetchAuthMutation(api.transactions.create, {
            userId, amount,
            date: date ?? new Date().toISOString().slice(0, 10),
            payeeId: payeeId as any, accountId: accountId as any, type: "income",
          });
          return `Income of $${amount.toFixed(2)} added${label ? ` (${label})` : ""}.`;
        },
      }),
      create_category: tool({
        description: "Create a new budget category in a group",
        inputSchema: z.object({
          categoryName: z.string(),
          groupName: z.string(),
        }),
        execute: async ({ categoryName, groupName }) => {
          const group = (groups as { _id: string; name: string; categories: { sortOrder: number }[] }[]).find(
            (g) => g.name.toLowerCase() === groupName.toLowerCase()
          );
          if (!group) return `Group "${groupName}" not found.`;
          const maxSort = Math.max(0, ...group.categories.map((c) => c.sortOrder));
          await fetchAuthMutation(api.categories.addCategory, {
            userId, groupId: group._id as any, name: categoryName, sortOrder: maxSort + 1,
          });
          return `Category "${categoryName}" created in "${groupName}".`;
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
