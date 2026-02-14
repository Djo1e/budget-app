"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getCurrentMonth } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface StepIncomeProps {
  profileId: Id<"userProfiles">;
  onNext: () => void;
  onBack: () => void;
}

export function StepIncome({ profileId, onNext, onBack }: StepIncomeProps) {
  const [amount, setAmount] = useState("");
  const createIncome = useMutation(api.incomeEntries.create);

  async function handleNext() {
    if (!amount) return;
    await createIncome({
      userId: profileId,
      month: getCurrentMonth(),
      amount: parseFloat(amount),
      label: "Initial income",
      date: new Date().toISOString().split("T")[0],
    });
    onNext();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How much do you have to budget?</CardTitle>
        <CardDescription>
          Enter the total amount you want to budget this month. You can add more
          income later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-2xl"
          />
        </div>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
