"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveFormContainer } from "@/components/ui/responsive-form-container";
import { Plus } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface AddIncomeDialogProps {
  onAdd: (data: {
    amount: number;
    date: string;
    payeeName: string;
    accountId: string;
  }) => void;
  month: string;
  accounts: Doc<"accounts">[];
  payees: Doc<"payees">[];
}

export function AddIncomeDialog({ onAdd, month, accounts, payees }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setPayeeName("");
      setAccountId(accounts[0]?._id ?? "");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, accounts]);

  const filteredPayees = useMemo(() => {
    if (!payeeName.trim()) return [];
    const lower = payeeName.toLowerCase();
    return payees.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [payeeName, payees]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    if (!payeeName.trim()) return;
    if (!accountId) return;
    onAdd({
      amount: Math.round(parsed * 100) / 100,
      date,
      payeeName: payeeName.trim(),
      accountId,
    });
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Income
      </Button>
      <ResponsiveFormContainer
        open={open}
        onOpenChange={setOpen}
        title="Add Income"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-amount">Amount</Label>
            <Input
              id="income-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 relative">
            <Label htmlFor="income-payee">Source</Label>
            <Input
              id="income-payee"
              placeholder="e.g. Employer, Freelance Client"
              value={payeeName}
              onChange={(e) => {
                setPayeeName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
              required
            />
            {showSuggestions && filteredPayees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                {filteredPayees.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => {
                      setPayeeName(p.name);
                      setShowSuggestions(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Deposit Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acct) => (
                  <SelectItem key={acct._id} value={acct._id}>
                    {acct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="income-date">Date</Label>
            <Input
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </ResponsiveFormContainer>
    </>
  );
}
