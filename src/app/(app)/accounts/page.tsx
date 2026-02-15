"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { calculateAccountBalance } from "@/lib/budget-math";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormDrawer } from "@/components/accounts/AccountFormDrawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function AccountsPage() {
  const { userProfile } = useAuthGuard();
  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Doc<"accounts"> | null>(null);

  const accounts = useQuery(
    api.accounts.listByUser,
    userId ? { userId } : "skip"
  );

  const allTransactions = useQuery(
    api.transactions.listByUser,
    userId ? { userId } : "skip"
  );

  const createAccount = useMutation(api.accounts.create);
  const updateAccount = useMutation(api.accounts.update);
  const removeAccount = useMutation(api.accounts.remove);

  const balanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    (accounts ?? []).forEach((acct) => {
      const acctTx = (allTransactions ?? []).filter(
        (t) => t.accountId === acct._id
      );
      map[acct._id] = calculateAccountBalance(acct.initialBalance, acctTx);
    });
    return map;
  }, [accounts, allTransactions]);

  const handleSubmit = useCallback(
    async (data: {
      name: string;
      type: "checking" | "savings" | "cash" | "credit";
      initialBalance: number;
    }) => {
      if (!userId) return;
      try {
        if (editingAccount) {
          await updateAccount({ id: editingAccount._id, ...data });
        } else {
          await createAccount({ userId, ...data });
        }
        setEditingAccount(null);
      } catch {
        toast.error("Failed to save account");
      }
    },
    [userId, editingAccount, createAccount, updateAccount]
  );

  const handleEdit = useCallback(
    (id: Id<"accounts">) => {
      const acct = (accounts ?? []).find((a) => a._id === id);
      if (acct) {
        setEditingAccount(acct);
        setDrawerOpen(true);
      }
    },
    [accounts]
  );

  const handleDelete = useCallback(
    async (id: Id<"accounts">) => {
      try {
        await removeAccount({ id });
        toast.success("Account deleted");
      } catch {
        toast.error("Failed to delete account");
      }
    },
    [removeAccount]
  );

  if (!userId || !accounts || allTransactions === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingAccount(null);
            setDrawerOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No accounts yet</p>
          <p className="text-sm mt-1">Add your first account to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((acct) => (
            <AccountCard
              key={acct._id}
              account={acct}
              balance={balanceMap[acct._id] ?? acct.initialBalance}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AccountFormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingAccount(null);
        }}
        mode={editingAccount ? "edit" : "create"}
        initialValues={editingAccount ?? undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
