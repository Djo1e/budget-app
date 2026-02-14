"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel, getNextMonth, getPreviousMonth } from "@/lib/month-utils";

interface MonthSelectorProps {
  month: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ month, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMonthChange(getPreviousMonth(month))}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center font-medium">
        {formatMonthLabel(month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onMonthChange(getNextMonth(month))}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
