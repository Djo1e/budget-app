"use client";

import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const available = assigned - spent;

  function handleAmountClick() {
    setInputValue(assigned.toFixed(2));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleInputBlur() {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const rounded = Math.round(parsed * 100) / 100;
      onAssignmentChange(categoryId, rounded);
      onAssignmentCommit(categoryId, rounded);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  }

  return (
    <>
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[1fr_100px_1fr_80px_80px] items-center gap-3 py-1.5 text-sm">
        <span className="truncate">{name}</span>

        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            min={0}
            step={0.01}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="h-7 text-right text-sm"
          />
        ) : (
          <button
            onClick={handleAmountClick}
            className="text-right font-medium hover:underline cursor-pointer"
          >
            {formatCurrency(assigned, currency)}
          </button>
        )}

        <Slider
          value={[assigned]}
          max={Math.max(totalIncome, assigned + 100)}
          step={1}
          onValueChange={([v]) => onAssignmentChange(categoryId, v)}
          onValueCommit={([v]) => onAssignmentCommit(categoryId, v)}
          className="w-full"
        />

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
