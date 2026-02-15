"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getCurrentMonth, formatCurrency } from "@/lib/currencies";
import { calculateReadyToAssign, calculateAccountBalance } from "@/lib/budget-math";
import { ReadyToAssignBanner } from "@/components/budget/ReadyToAssignBanner";
import { TransactionFormDrawer } from "@/components/transactions/TransactionFormDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NLQuickAdd } from "@/components/transactions/NLQuickAdd";
import type { ParseTransactionResponse } from "@/lib/ai/parse-transaction";
import { toast } from "sonner";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { userProfile } = useAuthGuard();
  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";
  const month = getCurrentMonth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nlPrefill, setNlPrefill] = useState<{
    amount: number;
    date: string;
    payeeName: string;
    categoryId?: Id<"categories">;
  } | null>(null);

  const accounts = useQuery(
    api.accounts.listByUser,
    userId ? { userId } : "skip"
  );
  const categoryGroups = useQuery(
    api.categories.listGroupsByUser,
    userId ? { userId } : "skip"
  );
  const payees = useQuery(
    api.payees.listByUser,
    userId ? { userId } : "skip"
  );
  const incomeEntries = useQuery(
    api.incomeEntries.listByUserMonth,
    userId ? { userId, month } : "skip"
  );
  const allocations = useQuery(
    api.budgetAllocations.listByUserMonth,
    userId ? { userId, month } : "skip"
  );
  const recentTransactions = useQuery(
    api.transactions.getRecent,
    userId ? { userId, limit: 5 } : "skip"
  );
  const allTransactions = useQuery(
    api.transactions.listByUser,
    userId ? { userId } : "skip"
  );

  const getOrCreatePayee = useMutation(api.payees.getOrCreate);
  const createTx = useMutation(api.transactions.create);

  const readyToAssign = useMemo(
    () =>
      calculateReadyToAssign(
        incomeEntries ?? [],
        allocations ?? [],
        month
      ),
    [incomeEntries, allocations, month]
  );

  const payeeMap = useMemo(() => {
    const map: Record<string, Doc<"payees">> = {};
    (payees ?? []).forEach((p) => { map[p._id] = p; });
    return map;
  }, [payees]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categoryGroups ?? []).forEach((g) => {
      g.categories.forEach((c) => { map[c._id] = c.name; });
    });
    return map;
  }, [categoryGroups]);

  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    (accounts ?? []).forEach((acct) => {
      const acctTx = (allTransactions ?? []).filter(
        (t) => t.accountId === acct._id
      );
      map[acct._id] = calculateAccountBalance(acct.initialBalance, acctTx);
    });
    return map;
  }, [accounts, allTransactions]);

  async function handleQuickAdd(data: {
    amount: number;
    date: string;
    payeeName: string;
    categoryId?: Id<"categories">;
    accountId: Id<"accounts">;
    notes?: string;
  }) {
    if (!userId) return;
    const payeeId = await getOrCreatePayee({ userId, name: data.payeeName });
    await createTx({
      userId,
      amount: data.amount,
      date: data.date,
      payeeId,
      categoryId: data.categoryId,
      accountId: data.accountId,
      notes: data.notes,
    });
  }

  function handleNLParsed(result: ParseTransactionResponse) {
    const allCategories = (categoryGroups ?? []).flatMap((g) => g.categories);
    const matchedCategory = result.categoryName
      ? allCategories.find(
          (c) => c.name.toLowerCase() === result.categoryName!.toLowerCase()
        )
      : undefined;

    setNlPrefill({
      amount: result.amount,
      date: result.date,
      payeeName: result.payeeName,
      categoryId: matchedCategory?._id,
    });
    setDrawerOpen(true);
  }

  if (
    !userId ||
    !accounts ||
    !categoryGroups ||
    payees === undefined ||
    incomeEntries === undefined ||
    allocations === undefined ||
    recentTransactions === undefined ||
    allTransactions === undefined
  ) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    checking: "Checking",
    savings: "Savings",
    cash: "Cash",
    credit: "Credit",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <Link href="/budget">
        <ReadyToAssignBanner amount={readyToAssign} currency={currency} />
      </Link>

      <NLQuickAdd
        categories={(categoryGroups ?? []).flatMap((g) =>
          g.categories.map((c) => ({ id: c._id, name: c.name }))
        )}
        payees={(payees ?? []).map((p) => ({ id: p._id, name: p.name }))}
        onParsed={handleNLParsed}
        onError={() => toast.error("Couldn't parse that. Try the manual form.")}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => {
                  const formattedDate = new Date(tx.date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  );
                  return (
                    <div key={tx._id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground shrink-0">{formattedDate}</span>
                        <span className="font-medium truncate">
                          {payeeMap[tx.payeeId]?.name ?? "Unknown"}
                        </span>
                      </div>
                      <span className="font-medium text-destructive shrink-0 ml-2">
                        -{formatCurrency(tx.amount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Balances */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Accounts</CardTitle>
              <Link href="/accounts">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts yet.</p>
            ) : (
              <div className="space-y-2">
                {accounts.map((acct) => (
                  <div key={acct._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{acct.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeLabels[acct.type] ?? acct.type}
                      </Badge>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(accountBalances[acct._id] ?? acct.initialBalance, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile FAB */}
      <button
        className="md:hidden fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        onClick={() => setDrawerOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

      <TransactionFormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setNlPrefill(null);
        }}
        mode="create"
        accounts={accounts}
        categoryGroups={categoryGroups}
        payees={payees}
        prefill={nlPrefill ?? undefined}
        onSubmit={handleQuickAdd}
      />
    </div>
  );
}
