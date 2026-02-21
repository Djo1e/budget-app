"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SuggestedAllocation = {
  categoryId: string;
  categoryName: string;
  suggested: number;
  lastMonthSpent: number;
  reasoning: string;
};

type Props = {
  month: string;
  userId: Id<"userProfiles">;
  totalAllocated: number;
  currency: string;
};

export function SmartSetupBanner({ month, userId, totalAllocated, currency }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedAllocation[] | null>(null);
  const [summary, setSummary] = useState("");
  const upsertAllocation = useMutation(api.budgetAllocations.upsert);

  // Only show if no allocations yet (and no suggestions loaded)
  if (totalAllocated > 0 && !suggestions) return null;

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data = await res.json();
      setSuggestions(data.allocations);
      setSummary(data.summary);
    } catch {
      toast.error("Could not generate budget suggestions");
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (!suggestions) return;
    setLoading(true);
    try {
      await Promise.all(
        suggestions.map((s) =>
          upsertAllocation({
            userId,
            month,
            categoryId: s.categoryId as Id<"categories">,
            assignedAmount: s.suggested,
          })
        )
      );
      toast.success("Budget applied!");
      setSuggestions(null);
    } catch {
      toast.error("Failed to apply budget");
    } finally {
      setLoading(false);
    }
  };

  // Before suggestions are fetched: show the banner
  if (!suggestions) {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Set up {month}&apos;s budget</p>
          <p className="text-xs text-muted-foreground">
            AI can suggest allocations based on your spending history
          </p>
        </div>
        <Button size="sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {loading ? "Thinking..." : "AI Suggest"}
        </Button>
      </div>
    );
  }

  // After suggestions: show the table
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm">{summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Category</th>
              <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Last Month</th>
              <th className="py-1.5 px-2 text-right font-medium text-muted-foreground">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.categoryId} className="border-b border-border/50">
                <td className="py-1.5 px-2">{s.categoryName}</td>
                <td className="py-1.5 px-2 text-right text-muted-foreground">
                  ${s.lastMonthSpent.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right font-medium">
                  ${s.suggested.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={applyAll} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply All"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSuggestions(null)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
