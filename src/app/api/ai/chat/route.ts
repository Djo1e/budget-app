import { streamText, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { formatSpendingByCategory, formatAccountBalances } from "@/lib/ai/chat-tools";

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

  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are a helpful budget assistant. The user's currency is ${currency}. The current month is ${currentMonth}. Be concise and helpful. When reporting amounts, use the user's currency format. If you need data to answer a question, use the available tools.`,
    messages,
    maxOutputTokens: 1000,
    tools: {
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
          const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
          const categoryMap: Record<string, string> = {};
          for (const g of groups) {
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
          const accounts = await fetchAuthQuery(api.accounts.listByUser, { userId });
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
          const income = await fetchAuthQuery(api.incomeEntries.listByUserMonth, {
            userId,
            month,
          });
          const allocations = await fetchAuthQuery(api.budgetAllocations.listByUserMonth, {
            userId,
            month,
          });
          const totalIncome = (income as { amount: number }[]).reduce((s, e) => s + e.amount, 0);
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
          const payees = await fetchAuthQuery(api.payees.listByUser, { userId });
          const payeeMap: Record<string, string> = {};
          for (const p of payees) payeeMap[p._id] = p.name;

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
          const groups = await fetchAuthQuery(api.categories.listGroupsByUser, { userId });
          if (groups.length === 0) return "No categories set up.";
          const lines = (groups as { name: string; categories: { name: string }[] }[]).map(
            (g) =>
              `${g.name}: ${g.categories.map((c) => c.name).join(", ")}`
          );
          return lines.join("\n");
        },
      }),
    },
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse();
}
