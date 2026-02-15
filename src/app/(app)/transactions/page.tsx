"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { TransactionFormDrawer } from "@/components/transactions/TransactionFormDrawer";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import {
  TransactionFilters,
  type TransactionFilterValues,
} from "@/components/transactions/TransactionFilters";
import { NLQuickAdd } from "@/components/transactions/NLQuickAdd";
import type { ParseTransactionResponse } from "@/lib/ai/parse-transaction";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TransactionsPage() {
  const { userProfile } = useAuthGuard();
  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";

  const [filters, setFilters] = useState<TransactionFilterValues>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Doc<"transactions"> | null>(null);
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
  const transactions = useQuery(
    api.transactions.listByUser,
    userId
      ? {
          userId,
          categoryId: filters.categoryId
            ? (filters.categoryId as Id<"categories">)
            : undefined,
          accountId: filters.accountId
            ? (filters.accountId as Id<"accounts">)
            : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      : "skip"
  );

  const getOrCreatePayee = useMutation(api.payees.getOrCreate);
  const createTx = useMutation(api.transactions.create);
  const updateTx = useMutation(api.transactions.update);
  const removeTx = useMutation(api.transactions.remove);

  const payeeMap = useMemo(() => {
    const map: Record<string, Doc<"payees">> = {};
    (payees ?? []).forEach((p) => {
      map[p._id] = p;
    });
    return map;
  }, [payees]);

  const accountMap = useMemo(() => {
    const map: Record<string, Doc<"accounts">> = {};
    (accounts ?? []).forEach((a) => {
      map[a._id] = a;
    });
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    (categoryGroups ?? []).forEach((g) => {
      g.categories.forEach((c) => {
        map[c._id] = c.name;
      });
    });
    return map;
  }, [categoryGroups]);

  const handleSubmit = useCallback(
    async (data: {
      amount: number;
      date: string;
      payeeName: string;
      categoryId?: Id<"categories">;
      accountId: Id<"accounts">;
      notes?: string;
    }) => {
      if (!userId) return;
      const payeeId = await getOrCreatePayee({
        userId,
        name: data.payeeName,
      });

      if (editingTx) {
        await updateTx({
          id: editingTx._id,
          amount: data.amount,
          date: data.date,
          payeeId,
          categoryId: data.categoryId,
          accountId: data.accountId,
          notes: data.notes,
        });
      } else {
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
      setEditingTx(null);
    },
    [userId, editingTx, getOrCreatePayee, createTx, updateTx]
  );

  const handleEdit = useCallback(
    (id: Id<"transactions">) => {
      const tx = (transactions ?? []).find((t) => t._id === id);
      if (tx) {
        setEditingTx(tx);
        setDrawerOpen(true);
      }
    },
    [transactions]
  );

  const handleDelete = useCallback(
    async (id: Id<"transactions">) => {
      await removeTx({ id });
      setEditingTx(null);
    },
    [removeTx]
  );

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
    transactions === undefined
  ) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const editInitialValues = editingTx
    ? {
        id: editingTx._id,
        amount: editingTx.amount,
        date: editingTx.date,
        payeeId: editingTx.payeeId,
        payeeName: payeeMap[editingTx.payeeId]?.name ?? "",
        categoryId: editingTx.categoryId,
        accountId: editingTx.accountId,
        notes: editingTx.notes,
      }
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingTx(null);
            setDrawerOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Add</span>
        </Button>
      </div>

      <NLQuickAdd
        categories={(categoryGroups ?? []).flatMap((g) =>
          g.categories.map((c) => ({ id: c._id, name: c.name }))
        )}
        payees={(payees ?? []).map((p) => ({ id: p._id, name: p.name }))}
        onParsed={handleNLParsed}
        onError={() => toast.error("Couldn't parse that. Try the manual form.")}
      />

      <TransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        accounts={accounts}
        categoryGroups={categoryGroups}
      />

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No transactions yet</p>
          <p className="text-sm mt-1">Add your first transaction to get started.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[100px_1fr_1fr_1fr_100px_40px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Date</span>
            <span>Payee</span>
            <span>Category</span>
            <span>Account</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx._id}
              transaction={tx}
              payeeName={payeeMap[tx.payeeId]?.name ?? "Unknown"}
              categoryName={tx.categoryId ? categoryMap[tx.categoryId] : undefined}
              accountName={accountMap[tx.accountId]?.name ?? "Unknown"}
              currency={currency}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <TransactionFormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingTx(null);
            setNlPrefill(null);
          }
        }}
        mode={editingTx ? "edit" : "create"}
        accounts={accounts}
        categoryGroups={categoryGroups}
        payees={payees}
        initialValues={editInitialValues}
        prefill={!editingTx ? (nlPrefill ?? undefined) : undefined}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
