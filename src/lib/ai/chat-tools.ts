export function formatSpendingByCategory(
  transactions: { amount: number; categoryId?: string; date: string; type: string }[],
  categoryMap: Record<string, string>,
  month: string
): string {
  const filtered = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(month)
  );

  const totals: Record<string, number> = {};
  for (const t of filtered) {
    const name = t.categoryId ? (categoryMap[t.categoryId] ?? "Uncategorized") : "Uncategorized";
    totals[name] = (totals[name] ?? 0) + t.amount;
  }

  if (Object.keys(totals).length === 0) return "No spending found for this month.";

  const lines = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `- ${name}: $${amount.toFixed(2)}`);

  return `Spending for ${month}:\n${lines.join("\n")}`;
}

export function formatAccountBalances(
  accounts: { name: string; initialBalance: number; _id: string; type: string }[],
  transactions: { amount: number; accountId: string; type: string }[]
): string {
  if (accounts.length === 0) return "No accounts found.";

  const lines = accounts.map((acct) => {
    const spent = transactions
      .filter((t) => t.accountId === acct._id && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = acct.initialBalance - spent;
    return `- ${acct.name} (${acct.type}): $${balance.toFixed(2)}`;
  });

  return `Account balances:\n${lines.join("\n")}`;
}
