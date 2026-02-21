"use client";

import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Check, X } from "lucide-react";

export const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => (
      <div
        className={cn(
          "rounded-lg border p-3 text-sm",
          props.variant === "success" && "border-green-500/30 bg-green-500/10",
          props.variant === "warning" && "border-yellow-500/30 bg-yellow-500/10",
          props.variant === "destructive" && "border-red-500/30 bg-red-500/10",
          !props.variant || props.variant === "default" ? "bg-muted/50" : ""
        )}
      >
        {props.title && <div className="font-medium mb-2">{props.title}</div>}
        {children}
      </div>
    ),
    Text: ({ props }) => (
      <p
        className={cn(
          "text-sm",
          props.weight === "medium" && "font-medium",
          props.weight === "bold" && "font-bold",
          props.size === "sm" && "text-xs",
          props.size === "lg" && "text-base",
          props.size === "xl" && "text-lg",
          props.color === "muted" && "text-muted-foreground",
          props.color === "success" && "text-green-500",
          props.color === "warning" && "text-yellow-500",
          props.color === "destructive" && "text-red-500"
        )}
      >
        {props.content}
      </p>
    ),
    Metric: ({ props }) => {
      const TrendIcon =
        props.trend === "up" ? TrendingUp : props.trend === "down" ? TrendingDown : Minus;
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{props.label}</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm font-medium",
                props.color === "success" && "text-green-500",
                props.color === "warning" && "text-yellow-500",
                props.color === "destructive" && "text-red-500"
              )}
            >
              {props.value}
            </span>
            {props.trend && <TrendIcon className="h-3 w-3 text-muted-foreground" />}
          </div>
        </div>
      );
    },
    Table: ({ props }) => (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {props.columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-1.5 px-2 font-medium text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                {props.columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "py-1.5 px-2",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {row[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    ProgressBar: ({ props }) => {
      const pct = props.max > 0 ? Math.min((props.current / props.max) * 100, 100) : 0;
      return (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{props.label}</span>
            <span className="text-muted-foreground">
              {props.format === "percent"
                ? `${Math.round(pct)}%`
                : `${props.current} / ${props.max}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                props.color === "success" && "bg-green-500",
                props.color === "warning" && "bg-yellow-500",
                props.color === "destructive" && "bg-red-500",
                (!props.color || props.color === "default") && "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    },
    BarChart: ({ props }) => {
      const maxVal = Math.max(...props.bars.map((b) => Math.max(b.value, b.secondaryValue ?? 0)), 1);
      return (
        <div className="space-y-2">
          {props.title && <div className="text-xs font-medium">{props.title}</div>}
          {props.bars.map((bar, i) => {
            const pct = (bar.value / maxVal) * 100;
            const secPct = bar.secondaryValue ? (bar.secondaryValue / maxVal) * 100 : 0;
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span>{bar.label}</span>
                  <span className="text-muted-foreground">{bar.value}</span>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  {bar.secondaryValue !== undefined && (
                    <div
                      className="absolute h-full rounded-full bg-muted-foreground/20"
                      style={{ width: `${secPct}%` }}
                    />
                  )}
                  <div
                    className={cn(
                      "absolute h-full rounded-full",
                      bar.color === "success" && "bg-green-500",
                      bar.color === "warning" && "bg-yellow-500",
                      bar.color === "destructive" && "bg-red-500",
                      (!bar.color || bar.color === "default") && "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    ActionButton: ({ props, emit }) => (
      <Button
        variant={props.variant ?? "default"}
        size={props.size ?? "sm"}
        className="text-xs"
        onClick={() => emit("press")}
      >
        {props.label}
      </Button>
    ),
    Divider: () => <hr className="border-border/50" />,
    Stack: ({ props, children }) => (
      <div
        className={cn(
          "flex",
          props.direction === "horizontal" ? "flex-row items-center" : "flex-col",
          props.gap === "sm" && "gap-1",
          props.gap === "lg" && "gap-4",
          (!props.gap || props.gap === "md") && "gap-2"
        )}
      >
        {children}
      </div>
    ),
    TransactionConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">
          {props.type === "income" ? "Add Income" : "New Transaction"}
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">{props.amount}</span>
          <span className="text-muted-foreground">Payee</span>
          <span>{props.payee}</span>
          {props.category && (
            <>
              <span className="text-muted-foreground">Category</span>
              <span>{props.category}</span>
            </>
          )}
          {props.account && (
            <>
              <span className="text-muted-foreground">Account</span>
              <span>{props.account}</span>
            </>
          )}
          {props.date && (
            <>
              <span className="text-muted-foreground">Date</span>
              <span>{props.date}</span>
            </>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    BudgetMoveConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Move Budget</div>
        <div className="text-xs">
          Move <span className="font-medium">{props.amount}</span> from{" "}
          <span className="font-medium">{props.fromCategory}</span> to{" "}
          <span className="font-medium">{props.toCategory}</span>
          {props.month && <span className="text-muted-foreground"> ({props.month})</span>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    AllocationConfirm: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="text-xs font-medium">Set Budget</div>
        <div className="text-xs">
          Set <span className="font-medium">{props.category}</span> to{" "}
          <span className="font-medium">{props.amount}</span>
          {props.month && <span className="text-muted-foreground"> for {props.month}</span>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="text-xs h-7" onClick={() => emit("confirm")}>
            <Check className="h-3 w-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("cancel")}>
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    ),
    SuggestionCard: ({ props, emit }) => (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div className="text-xs font-medium">{props.title}</div>
          <button onClick={() => emit("dismiss")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">{props.description}</div>
        {props.actionLabel && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => emit("action")}>
            {props.actionLabel}
          </Button>
        )}
      </div>
    ),
    AllocationTable: ({ props, emit }) => (
      <div className="rounded-lg border p-3 space-y-2">
        {props.title && <div className="text-xs font-medium">{props.title}</div>}
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
              {props.rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 px-2">{row.category}</td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground">{row.lastMonthSpent}</td>
                  <td className="py-1.5 px-2 text-right font-medium">{row.suggested}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center pt-1 text-xs">
          <span className="text-muted-foreground">
            Total: {props.totalSuggested} of {props.totalIncome}
          </span>
          <Button size="sm" className="text-xs h-7" onClick={() => emit("apply")}>
            Apply All
          </Button>
        </div>
      </div>
    ),
  },
  actions: {
    confirm_transaction: async (params, _setState, _state) => {
      // Stub: actual implementation will be wired up in the chat action handler
      console.log("confirm_transaction", params);
    },
    confirm_budget_move: async (params, _setState, _state) => {
      // Stub: actual implementation will be wired up in the chat action handler
      console.log("confirm_budget_move", params);
    },
    confirm_allocation: async (params, _setState, _state) => {
      // Stub: actual implementation will be wired up in the chat action handler
      console.log("confirm_allocation", params);
    },
    apply_suggested_budget: async (params, _setState, _state) => {
      // Stub: actual implementation will be wired up in the chat action handler
      console.log("apply_suggested_budget", params);
    },
    dismiss: async (_params, _setState, _state) => {
      // Stub: dismiss is handled by the UI
    },
  },
});
