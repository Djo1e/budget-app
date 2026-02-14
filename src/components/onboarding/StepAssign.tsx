"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatCurrency } from "@/lib/currencies";
import { getCurrentMonth } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepAssignProps {
  profileId: Id<"userProfiles">;
  currency: string;
  onFinish: () => void;
  onBack: () => void;
}

export function StepAssign({
  profileId,
  currency,
  onFinish,
  onBack,
}: StepAssignProps) {
  const month = getCurrentMonth();

  const groups = useQuery(api.categories.listGroupsByUser, {
    userId: profileId,
  });
  const incomeEntries = useQuery(api.incomeEntries.listByUserMonth, {
    userId: profileId,
    month,
  });
  const allocations = useQuery(api.budgetAllocations.listByUserMonth, {
    userId: profileId,
    month,
  });
  const upsertAllocation = useMutation(api.budgetAllocations.upsert);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [localAssignments, setLocalAssignments] = useState<
    Record<string, number>
  >({});

  const totalIncome = useMemo(
    () => (incomeEntries ?? []).reduce((sum, e) => sum + e.amount, 0),
    [incomeEntries]
  );

  const totalAssigned = useMemo(() => {
    const serverAmounts: Record<string, number> = {};
    (allocations ?? []).forEach((a) => {
      serverAmounts[a.categoryId] = a.assignedAmount;
    });
    const merged = { ...serverAmounts, ...localAssignments };
    return Object.values(merged).reduce((sum, v) => sum + v, 0);
  }, [allocations, localAssignments]);

  const readyToAssign = totalIncome - totalAssigned;
  const currencyCode = currency;

  function handleSliderChange(categoryId: string, value: number) {
    setLocalAssignments((prev) => ({ ...prev, [categoryId]: value }));
  }

  function handleSliderCommit(categoryId: string, value: number) {
    upsertAllocation({
      userId: profileId,
      month,
      categoryId: categoryId as Id<"categories">,
      assignedAmount: value,
    });
  }

  async function handleFinish() {
    await completeOnboarding({});
    onFinish();
  }

  if (!groups || !incomeEntries) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign your money</CardTitle>
        <CardDescription>
          Drag the sliders to assign money to each category.
        </CardDescription>
        <div
          className={cn(
            "text-2xl font-bold",
            readyToAssign < 0 ? "text-destructive" : "text-green-600"
          )}
        >
          Ready to assign: {formatCurrency(readyToAssign, currencyCode)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
        {groups.map((group) => (
          <div key={group._id} className="space-y-3">
            <h3 className="font-semibold">{group.name}</h3>
            {group.categories.map((cat) => {
              const currentValue =
                localAssignments[cat._id] ??
                allocations?.find((a) => a.categoryId === cat._id)
                  ?.assignedAmount ??
                0;

              return (
                <div key={cat._id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{cat.name}</span>
                    <span>{formatCurrency(currentValue, currencyCode)}</span>
                  </div>
                  <Slider
                    value={[currentValue]}
                    max={totalIncome}
                    step={10}
                    onValueChange={([v]) => handleSliderChange(cat._id, v)}
                    onValueCommit={([v]) => handleSliderCommit(cat._id, v)}
                  />
                </div>
              );
            })}
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleFinish}>Finish</Button>
        </div>
      </CardContent>
    </Card>
  );
}
