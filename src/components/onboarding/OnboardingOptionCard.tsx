"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OnboardingOptionCardProps {
  label: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}

export function OnboardingOptionCard({
  label,
  emoji,
  selected,
  onClick,
}: OnboardingOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-5 py-4 text-left text-sm font-medium transition-colors",
        selected
          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
          : "bg-muted/50 text-foreground hover:bg-muted"
      )}
    >
      {emoji && <span className="text-base">{emoji}</span>}
      <span>{label}</span>
      {selected && (
        <Check className="absolute right-4 h-4 w-4 text-primary" />
      )}
    </button>
  );
}
