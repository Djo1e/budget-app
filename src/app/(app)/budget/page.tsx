"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getCurrentMonth } from "@/lib/currencies";
import { calculateCategorySpent } from "@/lib/budget-math";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { MonthSelector } from "@/components/budget/MonthSelector";
import { ReadyToAssignBanner } from "@/components/budget/ReadyToAssignBanner";
import { SmartSetupBanner } from "@/components/budget/SmartSetupBanner";
import { MonthlyReview } from "@/components/budget/MonthlyReview";
import { CategoryGroupSection } from "@/components/budget/CategoryGroupSection";
import { AddIncomeDialog } from "@/components/budget/AddIncomeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function BudgetPage() {
  const { userProfile } = useAuthGuard();
  const [month, setMonth] = useState(getCurrentMonth);

  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";

  const groups = useQuery(
    api.categories.listGroupsByUser,
    userId ? { userId } : "skip"
  );
  const accounts = useQuery(
    api.accounts.listByUser,
    userId ? { userId } : "skip"
  );
  const payees = useQuery(
    api.payees.listByUser,
    userId ? { userId } : "skip"
  );
  const allocations = useQuery(
    api.budgetAllocations.listByUserMonth,
    userId ? { userId, month } : "skip"
  );
  const transactions = useQuery(
    api.transactions.listByUserMonth,
    userId ? { userId, month } : "skip"
  );

  const upsertAllocation = useMutation(api.budgetAllocations.upsert);
  const getOrCreatePayee = useMutation(api.payees.getOrCreate);
  const createTransaction = useMutation(api.transactions.create);
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const removeCategory = useMutation(api.categories.removeCategory);
  const createGroup = useMutation(api.categoryGroups.create);
  const updateGroup = useMutation(api.categoryGroups.update);
  const removeGroup = useMutation(api.categoryGroups.remove);

  const [localAssignments, setLocalAssignments] = useState<Record<string, number>>({});

  // Reset local assignments when month changes
  const [prevMonth, setPrevMonth] = useState(month);
  if (month !== prevMonth) {
    setLocalAssignments({});
    setPrevMonth(month);
  }

  const allocationMap = useMemo(() => {
    const map: Record<string, number> = {};
    (allocations ?? []).forEach((a) => {
      map[a.categoryId] = a.assignedAmount;
    });
    return { ...map, ...localAssignments };
  }, [allocations, localAssignments]);

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!groups || !transactions) return map;
    for (const group of groups) {
      for (const cat of group.categories) {
        map[cat._id] = calculateCategorySpent(transactions, cat._id, month);
      }
    }
    return map;
  }, [groups, transactions, month]);

  const totalIncome = useMemo(
    () => (transactions ?? [])
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );
  const totalAssigned = useMemo(
    () => Object.values(allocationMap).reduce((sum, v) => sum + v, 0),
    [allocationMap]
  );
  const totalAllocated = useMemo(
    () => (allocations ?? []).reduce((sum, a) => sum + a.assignedAmount, 0),
    [allocations]
  );
  const readyToAssign = totalIncome - totalAssigned;

  const handleAssignmentChange = useCallback((categoryId: string, amount: number) => {
    setLocalAssignments((prev) => ({ ...prev, [categoryId]: amount }));
  }, []);

  const handleAssignmentCommit = useCallback(
    async (categoryId: string, amount: number) => {
      if (!userId) return;
      try {
        await upsertAllocation({
          userId,
          month,
          categoryId: categoryId as Id<"categories">,
          assignedAmount: amount,
        });
      } catch {
        toast.error("Failed to save assignment");
      }
    },
    [userId, month, upsertAllocation]
  );

  async function handleAddIncome(data: {
    amount: number;
    date: string;
    payeeName: string;
    accountId: string;
  }) {
    if (!userId) return;
    try {
      const payeeId = await getOrCreatePayee({ userId, name: data.payeeName });
      await createTransaction({
        userId,
        amount: data.amount,
        date: data.date,
        payeeId,
        accountId: data.accountId as Id<"accounts">,
        type: "income",
      });
    } catch {
      toast.error("Failed to add income");
    }
  }

  async function handleAddCategory(groupId: Id<"categoryGroups">, name: string) {
    if (!userId || !groups) return;
    const group = groups.find((g) => g._id === groupId);
    const maxSort = group
      ? Math.max(0, ...group.categories.map((c) => c.sortOrder))
      : 0;
    try {
      await addCategory({
        userId,
        groupId,
        name,
        sortOrder: maxSort + 1,
      });
    } catch {
      toast.error("Failed to add category");
    }
  }

  async function handleRenameGroup(groupId: Id<"categoryGroups">, name: string) {
    try {
      await updateGroup({ id: groupId, name });
    } catch {
      toast.error("Failed to rename group");
    }
  }

  async function handleDeleteGroup(groupId: Id<"categoryGroups">) {
    if (!userId) return;
    try {
      await removeGroup({ id: groupId, userId });
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    }
  }

  async function handleRenameCategory(categoryId: Id<"categories">, name: string) {
    try {
      await updateCategory({ id: categoryId, name });
    } catch {
      toast.error("Failed to rename category");
    }
  }

  async function handleDeleteCategory(categoryId: Id<"categories">) {
    try {
      await removeCategory({ id: categoryId });
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  }

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  async function handleAddGroup() {
    if (!userId || !groups) return;
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const maxSort = Math.max(0, ...groups.map((g) => g.sortOrder));
    try {
      await createGroup({ userId, name: trimmed, sortOrder: maxSort + 1 });
      setNewGroupName("");
      setIsAddingGroup(false);
    } catch {
      toast.error("Failed to add group");
    }
  }

  if (!userId || !groups || !accounts || payees === undefined || allocations === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MonthSelector month={month} onMonthChange={setMonth} />
        <AddIncomeDialog onAdd={handleAddIncome} month={month} accounts={accounts} payees={payees} />
      </div>

      <ReadyToAssignBanner amount={readyToAssign} currency={currency} />

      {userId && (
        <SmartSetupBanner
          month={month}
          userId={userId}
          totalAllocated={totalAllocated}
          currency={currency}
        />
      )}

      <div className="space-y-2">
        {groups.map((group) => (
          <CategoryGroupSection
            key={group._id}
            groupId={group._id}
            groupName={group.name}
            categories={group.categories}
            allocations={allocationMap}
            activity={activityMap}
            totalIncome={totalIncome}
            currency={currency}
            isDeletable={group.name !== "Miscellaneous"}
            onAssignmentChange={handleAssignmentChange}
            onAssignmentCommit={handleAssignmentCommit}
            onAddCategory={handleAddCategory}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ))}
      </div>

      {month !== getCurrentMonth() && (
        <MonthlyReview month={month} />
      )}

      {isAddingGroup ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGroup();
              if (e.key === "Escape") setIsAddingGroup(false);
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAddGroup}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingGroup(false)}>Cancel</Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingGroup(true)}
          className="text-muted-foreground"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category Group
        </Button>
      )}
    </div>
  );
}
