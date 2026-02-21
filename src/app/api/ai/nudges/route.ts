import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "../../../../../convex/_generated/api";
import {
  predictCategorySpending,
  getDayOfMonth,
  getDaysInMonth,
} from "@/lib/spending-predictions";

export async function GET() {
  const session = await isAuthenticated();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userProfile = await fetchAuthQuery(api.users.getCurrentProfile);
  if (!userProfile) return Response.json([]);

  const userId = userProfile._id;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [transactions, allocations, groups] = await Promise.all([
    fetchAuthQuery(api.transactions.listByUserMonth, { userId, month }),
    fetchAuthQuery(api.budgetAllocations.listByUserMonth, { userId, month }),
    fetchAuthQuery(api.categories.listGroupsByUser, { userId }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (const g of groups as any[]) {
    for (const c of g.categories) categoryMap[c._id] = c.name;
  }

  const nudges: { title: string; description: string; actionLabel?: string }[] =
    [];
  const dayOfMonth = getDayOfMonth(month);
  const daysInMonth = getDaysInMonth(month);

  // Check for overspending pace
  const allocMap: Record<string, number> = {};
  for (const a of allocations as any[])
    allocMap[a.categoryId] = a.assignedAmount;

  for (const [catId, catName] of Object.entries(categoryMap)) {
    const spent = (transactions as any[])
      .filter((t) => t.categoryId === catId && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const allocated = allocMap[catId] ?? 0;
    if (allocated === 0) continue;
    const pred = predictCategorySpending({
      spent,
      allocated,
      dayOfMonth,
      daysInMonth,
    });
    if (pred.status === "over") {
      const overBy = Math.round(pred.projected - allocated);
      nudges.push({
        title: `${catName} on pace to overspend`,
        description: `You've spent $${spent.toFixed(0)} of $${allocated.toFixed(0)} with ${daysInMonth - dayOfMonth} days left. Projected overspend: ~$${overBy}.`,
        actionLabel: "Fix it",
      });
      if (nudges.length >= 2) break;
    }
  }

  // Check for unassigned money
  const totalIncome = (transactions as any[])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalAllocated = (allocations as any[]).reduce(
    (s: number, a: any) => s + a.assignedAmount,
    0
  );
  const unassigned = totalIncome - totalAllocated;
  if (unassigned > 0 && nudges.length < 3) {
    nudges.push({
      title: `$${unassigned.toFixed(0)} unassigned`,
      description:
        "You have money that hasn't been assigned to any category yet.",
      actionLabel: "Assign it",
    });
  }

  // Check for uncategorized transactions
  const uncategorized = (transactions as any[]).filter(
    (t) => t.type === "expense" && !t.categoryId
  );
  if (uncategorized.length > 0 && nudges.length < 3) {
    nudges.push({
      title: `${uncategorized.length} uncategorized transaction${uncategorized.length > 1 ? "s" : ""}`,
      description:
        "Some transactions need categories for accurate budget tracking.",
      actionLabel: "Categorize",
    });
  }

  return Response.json(nudges.slice(0, 3));
}
