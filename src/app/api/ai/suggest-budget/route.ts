import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import {
  buildSuggestionContext,
  suggestedAllocationSchema,
} from "@/lib/ai/budget-suggestions";

export async function POST(req: Request) {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return new Response("Profile not found", { status: 404 });

  const userId = userProfile._id;
  const { month } = (await req.json()) as { month: string };

  // Get previous month
  const [y, m] = month.split("-").map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [groups, prevTransactions, prevAllocations, currentTransactions] =
    await Promise.all([
      fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
      fetchAuthQuery(api.transactions.listByUserMonth, {
        userId,
        month: prevMonth,
      }),
      fetchAuthQuery(api.budgetAllocations.listByUserMonth, {
        userId,
        month: prevMonth,
      }),
      fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
    ]);

  const categories: { id: string; name: string; groupName: string }[] = [];
  for (const g of groups as {
    name: string;
    categories: { _id: string; name: string }[];
  }[]) {
    for (const c of g.categories) {
      categories.push({ id: c._id, name: c.name, groupName: g.name });
    }
  }

  const totalIncome = (
    currentTransactions as { type: string; amount: number }[]
  )
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const context = buildSuggestionContext({
    categories,
    lastMonthTransactions: prevTransactions as {
      amount: number;
      categoryId?: string;
      type: string;
      date: string;
    }[],
    lastMonthAllocations: prevAllocations as {
      categoryId: string;
      assignedAmount: number;
    }[],
    totalIncome,
  });

  const { text: aiResponse } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a budget advisor. Given spending history, suggest budget allocations for the new month. Return JSON only, no markdown fences. The response must be a JSON object with "allocations" array (each has categoryId, categoryName, suggested amount as number, lastMonthSpent as number, reasoning string) and a "summary" string with 2-3 sentences of advice.`,
    prompt: context,
    maxOutputTokens: 2000,
  });

  const cleaned = aiResponse
    .trim()
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "");
  const parsed = suggestedAllocationSchema.safeParse(JSON.parse(cleaned));

  if (!parsed.success) {
    return Response.json(
      { error: "Failed to generate suggestions" },
      { status: 422 }
    );
  }

  return Response.json(parsed.data);
}
