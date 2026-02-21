"use client";

import { useUIStream, Renderer, StateProvider, VisibilityProvider } from "@json-render/react";
import { registry } from "@/lib/json-render/registry";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

type Props = {
  month: string;
};

export function MonthlyReview({ month }: Props) {
  const { spec, isStreaming, error, send } = useUIStream({
    api: "/api/ai/monthly-review",
  });

  const hasReport = spec !== null;

  return (
    <div className="space-y-3">
      {!hasReport && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => send(month, { month })}
          disabled={isStreaming}
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {isStreaming ? "Generating..." : `Generate ${month} Review`}
        </Button>
      )}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
      {hasReport && (
        <StateProvider initialState={{}}>
          <VisibilityProvider>
            <Renderer spec={spec} registry={registry} loading={isStreaming} />
          </VisibilityProvider>
        </StateProvider>
      )}
    </div>
  );
}
