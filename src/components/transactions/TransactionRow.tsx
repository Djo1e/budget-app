"use client";

import { formatCurrency } from "@/lib/currencies";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

interface TransactionRowProps {
  transaction: Doc<"transactions">;
  payeeName: string;
  categoryName?: string;
  accountName: string;
  currency: string;
  onEdit: (id: Id<"transactions">) => void;
}

export function TransactionRow({
  transaction,
  payeeName,
  categoryName,
  accountName,
  currency,
  onEdit,
}: TransactionRowProps) {
  const formattedDate = new Date(transaction.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  return (
    <>
      {/* Desktop */}
      <div
        className="hidden md:grid grid-cols-[100px_1fr_1fr_1fr_100px_40px] items-center gap-2 px-4 py-2 hover:bg-accent/50 rounded-md cursor-pointer text-sm"
        onClick={() => onEdit(transaction._id)}
      >
        <span className="text-muted-foreground">{formattedDate}</span>
        <span className="font-medium truncate">{payeeName}</span>
        <span className="text-muted-foreground truncate">{categoryName ?? "Uncategorized"}</span>
        <span className="text-muted-foreground truncate">{accountName}</span>
        <span className="text-right font-medium text-destructive">
          -{formatCurrency(transaction.amount, currency)}
        </span>
        <span />
      </div>

      {/* Mobile */}
      <div
        className="md:hidden px-4 py-3 hover:bg-accent/50 rounded-md cursor-pointer"
        onClick={() => onEdit(transaction._id)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          <span className="font-medium text-sm text-destructive">
            -{formatCurrency(transaction.amount, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-medium text-sm truncate">{payeeName}</span>
          <span className="text-xs text-muted-foreground truncate ml-2">
            {categoryName ?? "Uncategorized"}
          </span>
        </div>
      </div>
    </>
  );
}
