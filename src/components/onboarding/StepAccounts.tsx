"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit Card" },
] as const;

interface StepAccountsProps {
  profileId: Id<"userProfiles">;
  onNext: () => void;
  onBack: () => void;
}

export function StepAccounts({ profileId, onNext, onBack }: StepAccountsProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<
    "checking" | "savings" | "cash" | "credit"
  >("checking");
  const [balance, setBalance] = useState("");

  const accounts = useQuery(api.accounts.listByUser, { userId: profileId });
  const createAccount = useMutation(api.accounts.create);
  const removeAccount = useMutation(api.accounts.remove);

  async function handleAdd() {
    if (!name || !balance) return;
    await createAccount({
      userId: profileId,
      name,
      type,
      initialBalance: parseFloat(balance),
    });
    setName("");
    setBalance("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add your accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account name</Label>
            <Input
              id="accountName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checking"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountType">Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as "checking" | "savings" | "cash" | "credit")
              }
            >
              <SelectTrigger id="accountType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialBalance">Initial balance</Label>
          <Input
            id="initialBalance"
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleAdd}
          disabled={!name || !balance}
        >
          Add account
        </Button>

        {accounts && accounts.length > 0 && (
          <div className="space-y-2 pt-2">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <span className="font-medium">{acc.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({acc.type})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>${acc.initialBalance.toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAccount({ id: acc._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!accounts || accounts.length === 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
