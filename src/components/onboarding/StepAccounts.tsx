"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingStepLayout } from "./OnboardingStepLayout";

export type OnboardingAccount = {
  name: string;
  type: "checking" | "savings" | "cash" | "credit";
  initialBalance: number;
};

interface StepAccountsProps {
  accounts: OnboardingAccount[];
  setAccounts: (accounts: OnboardingAccount[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const typeLabels: Record<OnboardingAccount["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
};

export function StepAccounts({
  accounts,
  setAccounts,
  onNext,
  onBack,
}: StepAccountsProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<OnboardingAccount["type"]>("checking");
  const [balance, setBalance] = useState("");

  function handleAdd() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const parsed = parseFloat(balance) || 0;
    setAccounts([
      ...accounts,
      {
        name: trimmedName,
        type,
        initialBalance: Math.round(parsed * 100) / 100,
      },
    ]);
    setName("");
    setType("checking");
    setBalance("");
  }

  function handleRemove(index: number) {
    setAccounts(accounts.filter((_, i) => i !== index));
  }

  return (
    <OnboardingStepLayout
      emoji="🏦"
      title="Add your accounts"
      onNext={onNext}
      onBack={onBack}
      nextLabel="Finish"
      skipText="Skip for now — you can add accounts later"
      onSkip={onNext}
    >
      <div className="space-y-6 max-w-sm mx-auto">
        <p className="text-center text-muted-foreground">
          Where does your money live? Add your checking, savings, or other
          accounts.
        </p>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="acct-name">Account Name</Label>
            <Input
              id="acct-name"
              placeholder="e.g. Main Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) handleAdd();
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as OnboardingAccount["type"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acct-balance">Balance</Label>
              <Input
                id="acct-balance"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            variant="secondary"
            className="w-full"
            disabled={!name.trim()}
          >
            Add Account
          </Button>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((acct, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-sm">{acct.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabels[acct.type]} · ${acct.initialBalance.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </OnboardingStepLayout>
  );
}
