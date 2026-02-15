"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "../../../convex/_generated/dataModel";

interface AccountFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: Doc<"accounts">;
  onSubmit: (data: {
    name: string;
    type: "checking" | "savings" | "cash" | "credit";
    initialBalance: number;
  }) => void;
}

export function AccountFormDrawer({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSubmit,
}: AccountFormDrawerProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("checking");
  const [initialBalance, setInitialBalance] = useState("");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialValues) {
        setName(initialValues.name);
        setType(initialValues.type);
        setInitialBalance(initialValues.initialBalance.toString());
      } else {
        setName("");
        setType("checking");
        setInitialBalance("");
      }
    }
  }, [open, mode, initialValues]);

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const balance = parseFloat(initialBalance) || 0;
    onSubmit({
      name: trimmedName,
      type: type as "checking" | "savings" | "cash" | "credit",
      initialBalance: Math.round(balance * 100) / 100,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "Add Account" : "Edit Account"}</SheetTitle>
          <SheetDescription>
            {mode === "create" ? "Create a new account" : "Update account details"}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acct-name">Name</Label>
            <Input
              id="acct-name"
              placeholder="e.g. Main Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
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
            <Label htmlFor="acct-balance">Initial Balance</Label>
            <Input
              id="acct-balance"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            {mode === "create" ? "Add Account" : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
