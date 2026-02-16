"use client";

import { useState, useEffect, useRef } from "react";
import { ResponsiveFormContainer } from "@/components/ui/responsive-form-container";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface AssignmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  assigned: number;
  spent: number;
  currency: string;
  totalIncome: number;
  onAssignmentChange: (amount: number) => void;
  onAssignmentCommit: (amount: number) => void;
}

export function AssignmentDrawer({
  open,
  onOpenChange,
  categoryName,
  assigned,
  spent,
  currency,
  totalIncome,
  onAssignmentChange,
  onAssignmentCommit,
}: AssignmentDrawerProps) {
  const [inputValue, setInputValue] = useState(assigned.toFixed(2));
  const inputRef = useRef<HTMLInputElement>(null);
  const available = assigned - spent;

  useEffect(() => {
    setInputValue(assigned.toFixed(2));
  }, [assigned]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [open]);

  function handleInputChange(value: string) {
    setInputValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onAssignmentChange(Math.round(parsed * 100) / 100);
    }
  }

  function handleSliderChange([v]: number[]) {
    setInputValue(v.toFixed(2));
    onAssignmentChange(v);
  }

  function handleDone() {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const rounded = Math.round(parsed * 100) / 100;
      onAssignmentCommit(rounded);
    }
    onOpenChange(false);
  }

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title={categoryName}
      description="Adjust budget assignment"
      showCloseButton={false}
    >
      <div className="space-y-6">
        <Input
          ref={inputRef}
          type="number"
          min={0}
          step={0.01}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className="h-14 text-center text-2xl font-semibold"
        />

        <Slider
          value={[assigned]}
          max={Math.max(totalIncome, assigned + 100)}
          step={1}
          onValueChange={handleSliderChange}
          onValueCommit={([v]) => onAssignmentCommit(v)}
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Spent: {formatCurrency(spent, currency)}</span>
          <span className={cn(available < 0 && "text-destructive")}>
            Available: {formatCurrency(available, currency)}
          </span>
        </div>

        <Button onClick={handleDone} className="w-full">
          Done
        </Button>
      </div>
    </ResponsiveFormContainer>
  );
}
