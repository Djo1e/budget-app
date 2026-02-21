import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import { catalog } from "@/lib/json-render/catalog";

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return new Response("Profile not found", { status: 404 });

  const userId = userProfile._id;
  const currency = userProfile.currency;
  const body = await req.json();
  const month: string = body.context?.month ?? body.month;
  if (!month) return new Response("Missing month", { status: 400 });

  // Get previous month for comparison
  const [y, m] = month.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [groups, transactions, allocations, prevTransactions, prevAllocations, accounts] =
    await Promise.all([
      fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
      fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
      fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month }),
      fetchAuthQuery(api.transactions.listByUserMonth, { userId, month: prevMonth }),
      fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month: prevMonth }),
      fetchAuthQuery(api.accounts.listByUser, { userId }),
    ]);

  const categoryMap: Record<string, string> = {};
  for (const g of groups as any[]) {
    for (const c of g.categories) categoryMap[c._id] = c.name;
  }

  // Build data summary
  const totalIncome = (transactions as any[])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = (transactions as any[])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const totalAllocated = (allocations as any[]).reduce((s: number, a: any) => s + a.assignedAmount, 0);

  const prevTotalExpenses = (prevTransactions as any[])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const catSpending: Record<string, number> = {};
  for (const t of transactions as any[]) {
    if (t.type === "expense" && t.categoryId) {
      const name = categoryMap[t.categoryId] ?? "Uncategorized";
      catSpending[name] = (catSpending[name] ?? 0) + t.amount;
    }
  }
  const catAllocated: Record<string, number> = {};
  for (const a of allocations as any[]) {
    const name = categoryMap[a.categoryId] ?? "Unknown";
    catAllocated[name] = a.assignedAmount;
  }

  const dataContext = [
    `Month: ${month}`,
    `Currency: ${currency}`,
    `Total Income: $${totalIncome.toFixed(2)}`,
    `Total Expenses: $${totalExpenses.toFixed(2)}`,
    `Total Budgeted: $${totalAllocated.toFixed(2)}`,
    `Net Saved: $${(totalIncome - totalExpenses).toFixed(2)}`,
    `Previous Month Expenses: $${prevTotalExpenses.toFixed(2)}`,
    "",
    "Category Breakdown (budget vs actual):",
    ...Object.entries(catSpending)
      .sort((a, b) => b[1] - a[1])
      .map(([name, spent]) => {
        const budgeted = catAllocated[name] ?? 0;
        const diff = budgeted - spent;
        return `- ${name}: budgeted $${budgeted.toFixed(2)}, spent $${spent.toFixed(2)}, ${diff >= 0 ? "under" : "over"} by $${Math.abs(diff).toFixed(2)}`;
      }),
  ].join("\n");

  const systemPrompt = [
    catalog.prompt({ mode: "generate" }),
    "",
    "You are generating a monthly financial review. Use the json-render components to create a visually rich report.",
    "Structure: 1) Summary metrics (use Metric components), 2) Category breakdown (use BarChart or Table), 3) Wins (Card variant=success), 4) Attention areas (Card variant=warning), 5) Month-over-month comparison if data exists, 6) 2-3 actionable suggestions.",
    "Keep text concise and actionable. Use the user's currency format.",
  ].join("\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250514"),
    system: systemPrompt,
    prompt: dataContext,
    maxOutputTokens: 3000,
  });

  // Stream raw text (JSONL patches) directly to the client for useUIStream
  return result.toTextStreamResponse();
}
