"use client";

import { formatCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface ReadyToAssignBannerProps {
  amount: number;
  currency: string;
}

export function ReadyToAssignBanner({ amount, currency }: ReadyToAssignBannerProps) {
  const isNegative = amount < 0;
  const isZero = amount === 0;

  return (
    <div
      className={cn(
        "px-4 py-3 text-center",
        isNegative && "bg-destructive/10 text-destructive",
        isZero && "bg-muted text-muted-foreground",
        !isNegative && !isZero && "bg-green-950 text-green-400"
      )}
    >
      <p className="text-sm font-medium">Ready to Assign</p>
      <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
      {isNegative && (
        <p className="text-sm mt-1">You have assigned more than your income this month.</p>
      )}
    </div>
  );
}
