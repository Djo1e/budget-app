import { z } from "zod/v4";

type CategoryInfo = { id: string; name: string; groupName: string };
type Transaction = {
  amount: number;
  categoryId?: string;
  type: string;
  date: string;
};
type Allocation = { categoryId: string; assignedAmount: number };

export function buildSuggestionContext(data: {
  categories: CategoryInfo[];
  lastMonthTransactions: Transaction[];
  lastMonthAllocations: Allocation[];
  totalIncome: number;
}): string {
  const spentMap: Record<string, number> = {};
  for (const t of data.lastMonthTransactions) {
    if (t.type === "expense" && t.categoryId) {
      spentMap[t.categoryId] = (spentMap[t.categoryId] ?? 0) + t.amount;
    }
  }

  const allocMap: Record<string, number> = {};
  for (const a of data.lastMonthAllocations) {
    allocMap[a.categoryId] = a.assignedAmount;
  }

  const lines = data.categories.map((cat) => {
    const spent = spentMap[cat.id] ?? 0;
    const allocated = allocMap[cat.id] ?? 0;
    return `- ${cat.name} (${cat.groupName}): allocated $${allocated}, spent $${spent}`;
  });

  return [
    `Total monthly income: $${data.totalIncome}`,
    "",
    "Last month's categories (allocated vs spent):",
    ...lines,
  ].join("\n");
}

export const suggestedAllocationSchema = z.object({
  allocations: z.array(
    z.object({
      categoryId: z.string(),
      categoryName: z.string(),
      suggested: z.number(),
      lastMonthSpent: z.number(),
      reasoning: z.string(),
    })
  ),
  summary: z.string(),
});

export type SuggestedAllocations = z.infer<typeof suggestedAllocationSchema>;
