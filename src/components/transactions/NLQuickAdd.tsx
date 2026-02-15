"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import type { ParseTransactionResponse } from "@/lib/ai/parse-transaction";

interface NLQuickAddProps {
  categories: { id: string; name: string }[];
  payees: { id: string; name: string }[];
  onParsed: (result: ParseTransactionResponse) => void;
  onError: () => void;
}

export function NLQuickAdd({ categories, payees, onParsed, onError }: NLQuickAddProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/parse-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), categories, payees }),
      });

      if (!res.ok) {
        onError();
        return;
      }

      const data: ParseTransactionResponse = await res.json();
      onParsed(data);
      setText("");
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Try "coffee 4.50 at Starbucks"'
        className="pl-9 pr-9"
        disabled={loading}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </form>
  );
}
