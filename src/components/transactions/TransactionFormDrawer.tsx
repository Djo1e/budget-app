"use client";

import { useState, useEffect, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/ui/responsive-form-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

type CategoryGroup = Doc<"categoryGroups"> & {
  categories: Doc<"categories">[];
};

interface TransactionFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  accounts: Doc<"accounts">[];
  categoryGroups: CategoryGroup[];
  payees: Doc<"payees">[];
  initialValues?: {
    id: Id<"transactions">;
    amount: number;
    date: string;
    payeeId: Id<"payees">;
    payeeName: string;
    categoryId?: Id<"categories">;
    accountId: Id<"accounts">;
    notes?: string;
  };
  prefill?: {
    amount?: number;
    date?: string;
    payeeName?: string;
    categoryId?: Id<"categories">;
  };
  onSubmit: (data: {
    amount: number;
    date: string;
    payeeName: string;
    categoryId?: Id<"categories">;
    accountId: Id<"accounts">;
    notes?: string;
  }) => void;
  onDelete?: (id: Id<"transactions">) => void;
}

export function TransactionFormDrawer({
  open,
  onOpenChange,
  mode,
  accounts,
  categoryGroups,
  payees,
  initialValues,
  prefill,
  onSubmit,
  onDelete,
}: TransactionFormDrawerProps) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [payeeName, setPayeeName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialValues) {
        setAmount(initialValues.amount.toString());
        setDate(initialValues.date);
        setPayeeName(initialValues.payeeName);
        setCategoryId(initialValues.categoryId ?? "");
        setAccountId(initialValues.accountId);
        setNotes(initialValues.notes ?? "");
      } else {
        setAmount(prefill?.amount?.toString() ?? "");
        setDate(prefill?.date ?? today);
        setPayeeName(prefill?.payeeName ?? "");
        setCategoryId(prefill?.categoryId ?? "");
        setAccountId(accounts[0]?._id ?? "");
        setNotes("");
      }
    }
  }, [open, mode, initialValues, accounts, today, prefill]);

  const filteredPayees = useMemo(() => {
    if (!payeeName.trim()) return [];
    const lower = payeeName.toLowerCase();
    return payees.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [payeeName, payees]);

  function selectPayee(payee: Doc<"payees">) {
    setPayeeName(payee.name);
    setShowSuggestions(false);
    if (payee.defaultCategoryId && !categoryId) {
      setCategoryId(payee.defaultCategoryId);
    }
  }

  function handleSubmit() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!payeeName.trim()) return;
    if (!accountId) return;

    onSubmit({
      amount: Math.round(parsedAmount * 100) / 100,
      date,
      payeeName: payeeName.trim(),
      categoryId: categoryId ? (categoryId as Id<"categories">) : undefined,
      accountId: accountId as Id<"accounts">,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Transaction" : "Edit Transaction"}
      description={mode === "create" ? "Record a new expense" : "Update transaction details"}
    >
      <div className="px-4 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tx-amount">Amount</Label>
            <Input
              id="tx-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-center text-2xl font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="tx-payee">Payee</Label>
            <Input
              id="tx-payee"
              placeholder="e.g. Grocery Store"
              value={payeeName}
              onChange={(e) => {
                setPayeeName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
            />
            {showSuggestions && filteredPayees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                {filteredPayees.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => selectPayee(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categoryGroups.map((group) => (
                  <SelectGroup key={group._id}>
                    <SelectLabel>{group.name}</SelectLabel>
                    {group.categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
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
            <Label htmlFor="tx-notes">Notes</Label>
            <textarea
              id="tx-notes"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring min-h-[60px] resize-none"
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {mode === "create" ? "Add Transaction" : "Save Changes"}
          </Button>

          {mode === "edit" && initialValues && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(initialValues.id);
                onOpenChange(false);
              }}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Transaction
            </Button>
          )}
        </div>
    </ResponsiveFormContainer>
  );
}
