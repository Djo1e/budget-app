"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currencies";
import { Pencil, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

interface AccountCardProps {
  account: Doc<"accounts">;
  balance: number;
  currency: string;
  onEdit: (id: Id<"accounts">) => void;
  onDelete: (id: Id<"accounts">) => void;
}

const typeLabels: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit",
};

export function AccountCard({
  account,
  balance,
  currency,
  onEdit,
  onDelete,
}: AccountCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{account.name}</CardTitle>
          <Badge variant="secondary">{typeLabels[account.type] ?? account.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatCurrency(balance, currency)}</p>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={() => onEdit(account._id)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(account._id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Link
            href={`/transactions?accountId=${account._id}`}
            className="ml-auto"
          >
            <Button variant="ghost" size="sm">
              Transactions
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
