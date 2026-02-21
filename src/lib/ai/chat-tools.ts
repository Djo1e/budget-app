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
    const acctTx = transactions.filter((t) => t.accountId === acct._id);
    const spent = acctTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const income = acctTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = acct.initialBalance + income - spent;
    return `- ${acct.name} (${acct.type}): $${balance.toFixed(2)}`;
  });

  return `Account balances:\n${lines.join("\n")}`;
}

export function buildBudgetContext(data: {
  categories: { id: string; name: string; groupName: string }[];
  accounts: { id: string; name: string; type: string }[];
  payees: { id: string; name: string }[];
}): string {
  const catLines = data.categories.map((c) => `- ${c.name} (group: ${c.groupName}, id: ${c.id})`);
  const acctLines = data.accounts.map((a) => `- ${a.name} (${a.type}, id: ${a.id})`);
  const payeeLines = data.payees.map((p) => `- ${p.name} (id: ${p.id})`);

  return [
    "## User's Categories",
    catLines.join("\n"),
    "\n## User's Accounts",
    acctLines.join("\n"),
    "\n## Known Payees",
    payeeLines.join("\n"),
  ].join("\n");
}
