"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { AssignmentDrawer } from "./AssignmentDrawer";

interface CategoryRowProps {
  categoryId: string;
  name: string;
  assigned: number;
  spent: number;
  totalIncome: number;
  currency: string;
  onAssignmentChange: (categoryId: string, amount: number) => void;
  onAssignmentCommit: (categoryId: string, amount: number) => void;
}

export function CategoryRow({
  categoryId,
  name,
  assigned,
  spent,
  totalIncome,
  currency,
  onAssignmentChange,
  onAssignmentCommit,
}: CategoryRowProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const available = assigned - spent;

  return (
    <>
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px] items-center gap-3 py-1.5 text-sm">
        <span className="truncate">{name}</span>

        <button
          onClick={() => setDrawerOpen(true)}
          className="text-right font-medium hover:underline cursor-pointer"
        >
          {formatCurrency(assigned, currency)}
        </button>

        <span className="text-right text-muted-foreground">
          {formatCurrency(spent, currency)}
        </span>

        <span className={cn("text-right", available < 0 ? "text-destructive" : "")}>
          {formatCurrency(available, currency)}
        </span>
      </div>

      {/* Mobile row */}
      <div className="grid md:hidden grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5 text-sm">
        <span className="truncate">{name}</span>

        <button
          onClick={() => setDrawerOpen(true)}
          className="text-right font-medium hover:underline cursor-pointer"
        >
          {formatCurrency(assigned, currency)}
        </button>

        <span className={cn("text-right", available < 0 ? "text-destructive" : "")}>
          {formatCurrency(available, currency)}
        </span>
      </div>

      <AssignmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        categoryName={name}
        assigned={assigned}
        spent={spent}
        currency={currency}
        totalIncome={totalIncome}
        onAssignmentChange={(amount) => onAssignmentChange(categoryId, amount)}
        onAssignmentCommit={(amount) => onAssignmentCommit(categoryId, amount)}
      />
    </>
  );
}
