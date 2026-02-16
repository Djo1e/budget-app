type Allocation = { assignedAmount: number; month: string };
type Transaction = {
  amount: number;
  categoryId?: string;
  date: string;
  type: "expense" | "transfer" | "income";
};

export function calculateReadyToAssign(
  transactions: Transaction[],
  allocations: Allocation[],
  month: string
): number {
  const totalIncome = transactions
    .filter((t) => t.type === "income" && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllocated = allocations
    .filter((a) => a.month === month)
    .reduce((sum, a) => sum + a.assignedAmount, 0);
  return totalIncome - totalAllocated;
}

export function calculateCategorySpent(
  transactions: Transaction[],
  categoryId: string,
  month: string
): number {
  return transactions
    .filter(
      (t) =>
        t.categoryId === categoryId &&
        t.type === "expense" &&
        t.date.startsWith(month)
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateAccountBalance(
  initialBalance: number,
  transactions: { amount: number; type: "expense" | "transfer" | "income" }[]
): number {
  const totalSpent = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  return initialBalance + totalIncome - totalSpent;
}
