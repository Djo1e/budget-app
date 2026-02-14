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
import { CategoryGroupSection } from "@/components/budget/CategoryGroupSection";
import { AddIncomeDialog } from "@/components/budget/AddIncomeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function BudgetPage() {
  const { userProfile } = useAuthGuard();
  const [month, setMonth] = useState(getCurrentMonth);

  const userId = userProfile?._id;
  const currency = userProfile?.currency ?? "USD";

  const groups = useQuery(
    api.categories.listGroupsByUser,
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
  const transactions = useQuery(
    api.transactions.listByUserMonth,
    userId ? { userId, month } : "skip"
  );

  const upsertAllocation = useMutation(api.budgetAllocations.upsert);
  const createIncome = useMutation(api.incomeEntries.create);
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
    () => (incomeEntries ?? []).reduce((sum, e) => sum + e.amount, 0),
    [incomeEntries]
  );
  const totalAssigned = useMemo(
    () => Object.values(allocationMap).reduce((sum, v) => sum + v, 0),
    [allocationMap]
  );
  const readyToAssign = totalIncome - totalAssigned;

  const handleAssignmentChange = useCallback((categoryId: string, amount: number) => {
    setLocalAssignments((prev) => ({ ...prev, [categoryId]: amount }));
  }, []);

  const handleAssignmentCommit = useCallback(
    (categoryId: string, amount: number) => {
      if (!userId) return;
      upsertAllocation({
        userId,
        month,
        categoryId: categoryId as Id<"categories">,
        assignedAmount: amount,
      });
    },
    [userId, month, upsertAllocation]
  );

  function handleAddIncome(amount: number, label: string, date: string) {
    if (!userId) return;
    createIncome({
      userId,
      month,
      amount,
      label: label || undefined,
      date,
    });
  }

  function handleAddCategory(groupId: Id<"categoryGroups">, name: string) {
    if (!userId || !groups) return;
    const group = groups.find((g) => g._id === groupId);
    const maxSort = group
      ? Math.max(0, ...group.categories.map((c) => c.sortOrder))
      : 0;
    addCategory({
      userId,
      groupId,
      name,
      sortOrder: maxSort + 1,
    });
  }

  function handleRenameGroup(groupId: Id<"categoryGroups">, name: string) {
    updateGroup({ id: groupId, name });
  }

  function handleDeleteGroup(groupId: Id<"categoryGroups">) {
    if (!userId) return;
    removeGroup({ id: groupId, userId });
  }

  function handleRenameCategory(categoryId: Id<"categories">, name: string) {
    updateCategory({ id: categoryId, name });
  }

  function handleDeleteCategory(categoryId: Id<"categories">) {
    removeCategory({ id: categoryId });
  }

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  function handleAddGroup() {
    if (!userId || !groups) return;
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    const maxSort = Math.max(0, ...groups.map((g) => g.sortOrder));
    createGroup({ userId, name: trimmed, sortOrder: maxSort + 1 });
    setNewGroupName("");
    setIsAddingGroup(false);
  }

  if (!userId || !groups || incomeEntries === undefined || allocations === undefined) {
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
        <AddIncomeDialog onAdd={handleAddIncome} month={month} />
      </div>

      <ReadyToAssignBanner amount={readyToAssign} currency={currency} />

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
